from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import torch
from dotenv import load_dotenv
import os

load_dotenv()  # Load SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env


print("\n" + "="*50)
print("SYSTEM CONFIGURATION REPORT:")
print(f"CUDA GPU Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"Detected GPU: {torch.cuda.get_device_name(0)}")
    print("Mode: GPU acceleration enabled (CUDA)")
else:
    print("Mode: Running on CPU (no GPU detected — this is fine)")
print("="*50 + "\n")

# --- IMPORT ALL MODULES AT STARTUP ---
# Importing these triggers model loading once — all models stay in memory
print("Loading skill extractor (MiniLM)...")
import skill_extractor  # noqa: F401

print("Loading JD predictor (DistilBERT)...")
import predict_skill  # noqa: F401

print("Loading gap scorer (BAAI/bge)...")
import gap_scorer  # noqa: F401

print("All models loaded. Starting FastAPI server...")

from pipeline import run_pipeline, run_pipeline_steps
from ollama_roadmap import is_ollama_running
from evaluate import run_full_evaluation
from supabase_client import save_analysis

# --- APP ---
app = FastAPI(
    title="HirePrepAI",
    description="Resume skill gap analysis and learning roadmap generator.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for local network testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- HEALTH CHECK ---
@app.get("/health")
def health():
    """Returns server and Ollama status."""
    return {
        "status": "ok",
        "ollama": "running" if is_ollama_running() else "not running"
    }


# --- MODEL EVALUATION ENDPOINT ---
@app.get("/evaluate")
def evaluate():
    """
    Runs a full evaluation of all three ML models:
      - all-MiniLM-L6-v2      (Skill Extractor)
      - BAAI/bge-base-en-v1.5 (Gap Scorer)
      - jd-skill-predictor    (DistilBERT)

    Returns a JSON report with latency, accuracy, similarity scores,
    and per-model metrics. NOTE: This may take 30-120 seconds to run.
    """
    try:
        report = run_full_evaluation()
        return JSONResponse(content=report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


# --- MAIN ENDPOINT ---
@app.post("/analyze")
async def analyze(
    resume_pdf: UploadFile = File(..., description="PDF resume file"),
    job_title: str = Form(None, description="Job title e.g. 'Data Scientist'"),
    jd_text: str  = Form(None, description="Raw job description text (alternative to job_title)"),
    stream: bool  = Form(False, description="Stream step-progress events via SSE"),
    user_id: str  = Form(None, description="Optional: Supabase user UUID for saving history"),
):
    """
    Full pipeline endpoint.
    Accepts a PDF resume + job title (or JD text).

    When stream=True, emits Server-Sent Events with step progress:
      data: {"type": "step", "step": N, "total": 5, "label": "..."}
      data: {"type": "result", ...full result...}
      data: [DONE]

    When stream=False, returns the full JSON result directly.
    """
    # Validate input
    if not job_title and not jd_text:
        raise HTTPException(
            status_code=422,
            detail="Provide either 'job_title' or 'jd_text' as a form field."
        )

    if resume_pdf.content_type != "application/pdf":
        raise HTTPException(
            status_code=415,
            detail="Only PDF files are supported."
        )

    pdf_bytes = await resume_pdf.read()

    # --- STREAMING RESPONSE (step-progress SSE) ---
    if stream:
        def event_stream():
            try:
                for event in run_pipeline_steps(pdf_bytes, job_title, jd_text):
                    # Save to history when we emit the final result event
                    if event.get("type") == "result" and user_id:
                        label = job_title or "Resume Analysis"
                        save_analysis(user_id, label, event)
                    yield f"data: {json.dumps(event)}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            finally:
                yield "data: [DONE]\n\n"

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            }
        )

    # --- NON-STREAMING RESPONSE ---
    else:
        try:
            result = run_pipeline(pdf_bytes, job_title, jd_text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        # Save to history if user is signed in
        if user_id:
            label = job_title or "Resume Analysis"
            save_analysis(user_id, label, result)

        return JSONResponse(content=result)
