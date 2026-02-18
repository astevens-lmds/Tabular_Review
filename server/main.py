from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from docling.document_converter import DocumentConverter
import tempfile
import os
import shutil
import time
from collections import defaultdict
import asyncio
import httpx
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

app = FastAPI(
    title="Tabular Review API",
    description="Backend API for Tabular Review — converts documents to Markdown using Docling.",
    version="1.0.0",
)

# --- Rate Limiting ---
# Simple in-memory rate limiter: max requests per IP within a sliding window
RATE_LIMIT_MAX_REQUESTS = int(os.environ.get("RATE_LIMIT_MAX_REQUESTS", "30"))
RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get("RATE_LIMIT_WINDOW_SECONDS", "60"))

_rate_limit_store: dict[str, list[float]] = defaultdict(list)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Simple sliding-window rate limiter per client IP."""
    # Only rate-limit the convert endpoint
    if request.url.path == "/convert":
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - RATE_LIMIT_WINDOW_SECONDS

        # Prune old entries
        _rate_limit_store[client_ip] = [
            t for t in _rate_limit_store[client_ip] if t > window_start
        ]

        if len(_rate_limit_store[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Rate limit exceeded. Max {RATE_LIMIT_MAX_REQUESTS} requests per {RATE_LIMIT_WINDOW_SECONDS}s."
                },
            )

        _rate_limit_store[client_ip].append(now)

    return await call_next(request)

# --- Configuration ---
MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".json", ".pptx", ".xlsx"}

# Configure CORS — use specific frontend origin from env, fallback to dev defaults
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
allowed_origins = [origin.strip() for origin in FRONTEND_ORIGIN.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

# Initialize converter (this might take a moment to load models on startup)
converter = DocumentConverter()

# Gemini API key — server-side only
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set in environment variables")

# Concurrency limiter — max 5 concurrent Gemini requests
_gemini_semaphore = asyncio.Semaphore(5)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiRequest(BaseModel):
    model: str
    contents: dict | list
    config: Optional[dict] = None


class ChatRequest(BaseModel):
    model: str
    message: str
    systemInstruction: Optional[str] = None
    history: Optional[list] = None


@app.post("/convert")
async def convert_document(file: UploadFile = File(...)):
    # Validate filename
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Validate extension
    suffix = os.path.splitext(file.filename)[1].lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Read file content with size check
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(content) / 1024 / 1024:.1f} MB). Maximum size is {MAX_FILE_SIZE_MB} MB."
        )
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            result = converter.convert(tmp_path)
            markdown_content = result.document.export_to_markdown()
            return {"markdown": markdown_content}
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error converting file: {e}")
        raise HTTPException(status_code=500, detail=f"Document conversion failed: {str(e)}")


@app.get("/health")
async def health_check():
    return {"status": "ok"}



@app.post("/api/gemini")
async def gemini_proxy(request: GeminiRequest):
    """Proxy Gemini generateContent calls through the backend, keeping the API key server-side."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")

    url = f"{GEMINI_API_BASE}/{request.model}:generateContent?key={GEMINI_API_KEY}"

    # Build the request body matching Google's API format
    body: dict = {}
    if isinstance(request.contents, dict):
        body["contents"] = [request.contents]
    else:
        body["contents"] = request.contents

    if request.config:
        generation_config = {}
        if "responseMimeType" in request.config:
            generation_config["responseMimeType"] = request.config["responseMimeType"]
        if "responseSchema" in request.config:
            generation_config["responseSchema"] = request.config["responseSchema"]
        if generation_config:
            body["generationConfig"] = generation_config
        if "systemInstruction" in request.config:
            body["systemInstruction"] = {"parts": [{"text": request.config["systemInstruction"]}]}

    async with _gemini_semaphore:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=body)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            return resp.json()


@app.post("/api/gemini/chat")
async def gemini_chat_proxy(request: ChatRequest):
    """Proxy Gemini chat calls through the backend."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")

    url = f"{GEMINI_API_BASE}/{request.model}:generateContent?key={GEMINI_API_KEY}"

    body: dict = {"contents": []}
    
    # Add history
    if request.history:
        for msg in request.history:
            body["contents"].append(msg)

    # Add current user message
    body["contents"].append({
        "role": "user",
        "parts": [{"text": request.message}]
    })

    if request.systemInstruction:
        body["systemInstruction"] = {"parts": [{"text": request.systemInstruction}]}

    async with _gemini_semaphore:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=body)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            data = resp.json()
            # Extract text from response
            try:
                text = data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError):
                text = "No response generated."
            return {"text": text}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
