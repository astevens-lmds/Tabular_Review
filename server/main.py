from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from docling.document_converter import DocumentConverter
import tempfile
import os
import shutil
import time
from collections import defaultdict

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

# Configure CORS
# In production, replace with specific origins
origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite default
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize converter (this might take a moment to load models on startup)
converter = DocumentConverter()


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
