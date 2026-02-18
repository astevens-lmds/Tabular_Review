
# Tabular Review for Bulk Document Analysis

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/framework-React-61DAFB.svg)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2.svg)

An AI-powered document review workspace that transforms unstructured legal contracts into structured, queryable datasets. Designed for legal professionals, auditors, and procurement teams to accelerate due diligence and contract analysis.

## 🚀 Features

- **AI-Powered Extraction**: Automatically extract key clauses, dates, amounts, and entities from PDFs using Google Gemini 2.5 Pro / 3.0.
- **High-Fidelity Conversion**: Uses **Docling** (running locally) to convert PDFs and DOCX files to clean Markdown text, preserving formatting and structure without hallucination.
- **Dynamic Schema**: Define columns with natural language prompts (e.g., "What is the governing law?").
- **Verification & Citations**: Click any extracted cell to view the exact source quote highlighted in the original document.
- **Spreadsheet Interface**: A high-density, Excel-like grid for managing bulk document reviews.
- **Integrated Chat Analyst**: Ask questions across your entire dataset (e.g., "Which contract has the most favorable MFN clause?").
- **Real-Time Progress**: Progress bar showing extraction status (X/Y cells completed).

## 🎬 Demo

https://github.com/user-attachments/assets/b63026d8-3df6-48a8-bb4b-eb8f24d3a1ca

## 🏗 Architecture

```
┌─────────────────────────────────┐
│         React Frontend          │
│  (Vite + TypeScript + Tailwind) │
│                                 │
│  ┌─────────┐  ┌──────────────┐  │
│  │DataGrid │  │ Gemini SDK   │  │
│  │Sidebar  │  │ (extraction  │  │
│  │Chat     │  │  & chat)     │  │
│  └─────────┘  └──────┬───────┘  │
│                      │          │
│       Google Gemini API         │
└──────────┬──────────────────────┘
           │ /convert (file upload)
┌──────────▼──────────────────────┐
│      FastAPI Backend            │
│  (Python + Docling)             │
│                                 │
│  PDF/DOCX → Markdown conversion │
└─────────────────────────────────┘
```

**Frontend** (`/`): React 19 SPA. Handles the grid UI, Gemini API calls for extraction/chat (client-side via `@google/genai` SDK), and document viewing.

**Backend** (`/server`): Python FastAPI server running Docling for document conversion. Converts uploaded PDF/DOCX files to Markdown text. The frontend sends files here before storing them.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **AI Integration**: Google GenAI SDK (Gemini 2.5 Flash, 2.5 Pro, 3.0 Pro)
- **Backend**: Python, FastAPI, Docling (document conversion)

## 📦 Getting Started

### Prerequisites

- **Node.js** 18+ (with npm)
- **Python** 3.10+
- **Google Gemini API Key** — get one from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 1. Clone the repository
```bash
git clone https://github.com/astevens-lmds/Tabular_Review.git
cd Tabular_Review
```

### 2. Environment Variables

Copy the example file and add your API key:
```bash
cp .env.example .env
```

Edit `.env` and set:
```env
VITE_GEMINI_API_KEY=your_google_api_key_here
VITE_API_URL=http://localhost:8000
```

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | **Yes** | Google Gemini API key for AI extraction and chat |
| `VITE_API_URL` | No | Backend URL (defaults to `http://localhost:8000`) |

### 3. Setup Frontend
```bash
npm install
```

### 4. Setup Backend (Docling)

The backend is required for document conversion (PDF/DOCX → Markdown).

```bash
cd server
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 5. Run

Start the backend (in one terminal):
```bash
cd server
source venv/bin/activate
python main.py
# Server runs at http://localhost:8000
```

Start the frontend (in another terminal):
```bash
npm run dev
# App runs at http://localhost:3000
```

### 🐳 Docker Deployment (Alternative)

```bash
cp .env.example .env
# Edit .env and add your Google Gemini API key

docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

## 📁 Project Structure

```
├── App.tsx                    # Main application component
├── index.tsx                  # React entry point
├── types.ts                   # TypeScript type definitions
├── components/
│   ├── DataGrid.tsx           # Spreadsheet-like grid
│   ├── VerificationSidebar.tsx # Cell inspection & document viewer
│   ├── ChatInterface.tsx      # AI chat analyst
│   ├── AddColumnMenu.tsx      # Column creation/editing
│   ├── ErrorBoundary.tsx      # React error boundary
│   ├── DocumentUpload.tsx     # File upload component
│   └── Icons.tsx              # Icon re-exports from lucide-react
├── services/
│   ├── geminiService.ts       # Gemini API integration
│   └── documentProcessor.ts   # Frontend → backend file conversion
├── utils/
│   └── sampleData.ts          # Built-in sample documents
├── server/
│   ├── main.py                # FastAPI backend
│   └── requirements.txt       # Python dependencies
├── .env.example               # Environment variable template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── docker-compose.yml         # Docker setup
├── Dockerfile.frontend        # Frontend Docker image
└── Dockerfile.backend         # Backend Docker image
```

## 🛡 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Disclaimer**: This tool is an AI assistant and should not be used as a substitute for professional legal advice. Always verify AI-generated results against the original documents.
