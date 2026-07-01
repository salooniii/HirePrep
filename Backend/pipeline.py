import fitz
import tempfile
import os
from typing import Generator
import torch

print("\n" + "="*50)
print("SYSTEM GPU/CPU CONFIGURATION REPORT:")
print(f"CUDA GPU Available on this machine: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"Detected GPU: {torch.cuda.get_device_name(0)}")
print("Optimization Strategy: ALL models (MiniLM, BAAI/bge, DistilBERT, Ollama Roadmap) are forced to\nGPU/CUDA for maximum hardware acceleration with zero CPU fallbacks.")
print("="*50 + "\n")

# Import all modules — models are loaded once at import time
from skill_extractor import extract_skills_from_text
from predict_skill import predict_skills
from gap_scorer import compute_gap
from ollama_roadmap import generate_roadmap, generate_roadmap_stream, is_ollama_running

# Step labels shown in the UI
PIPELINE_STEPS = [
    "Parsing Resume",
    "Extracting Skills",
    "Matching Job Description",
    "ATS Score Calculation",
    "Generating Roadmap",
]
TOTAL_STEPS = len(PIPELINE_STEPS)


# --- NAME EXTRACTION ---
def _extract_name(text: str) -> str:
    """
    Best-effort extraction of candidate name from the top of the resume.
    Assumes the first non-empty line is the name.
    """
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    # Skip common section headers that appear at the top
    skip_words = {"resume", "curriculum vitae", "cv", "profile"}
    for line in lines[:5]:
        if line.lower() not in skip_words and len(line.split()) <= 5:
            return line
    return "Candidate"


# --- PDF PARSER ---
def _parse_pdf(pdf_bytes: bytes) -> str:
    """
    Writes PDF bytes to a temp file, extracts text using PyMuPDF,
    then cleans up the temp file.
    Uses the same column-aware block parsing from skill_extractor.
    """
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        doc = fitz.open(tmp_path)
        text = ""
        for page in doc:
            blocks = page.get_text("blocks", sort=True)
            x0_values = [b[0] for b in blocks]
            max_x0 = max(x0_values) if x0_values else 0
            threshold = max_x0 * 0.4 if max_x0 > 300 else max_x0 + 1
            for block in blocks:
                if block[0] <= threshold:
                    text += block[4] + "\n"
        doc.close()
        return text

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


# --- MAIN PIPELINE (non-streaming) ---
def run_pipeline(
    pdf_bytes: bytes,
    job_title: str = None,
    jd_text: str = None
) -> dict:
    """
    Full sequential pipeline:
      PDF → resume_skills (MiniLM)
      job_title OR jd_text → jd_skills (DistilBERT or MiniLM)
      resume_skills + jd_skills → gap (BAAI/bge)
      missing skills → roadmap (Ollama)

    Returns a single dict with all results.
    Raises ValueError if neither job_title nor jd_text is provided.
    """
    if not job_title and not jd_text:
        raise ValueError("Provide either job_title or jd_text.")

    # Step 1 — Parse PDF
    print("[Pipeline] Parsing PDF...")
    resume_text = _parse_pdf(pdf_bytes)

    # Step 2 — Extract name from resume
    name = _extract_name(resume_text)
    print(f"[Pipeline] Candidate: {name}")

    # Step 3 — Extract resume skills
    print("[Pipeline] Extracting resume skills...")
    resume_skills = extract_skills_from_text(resume_text)
    print(f"[Pipeline] Found {len(resume_skills)} resume skills.")

    # Step 4 — Get JD skills
    if jd_text:
        print("[Pipeline] Extracting JD skills from pasted text...")
        jd_skills = extract_skills_from_text(jd_text)
    else:
        print(f"[Pipeline] Predicting JD skills for: {job_title}...")
        jd_skills = predict_skills(job_title)
    print(f"[Pipeline] Got {len(jd_skills)} JD skills.")

    # Step 5 — Gap analysis
    print("[Pipeline] Running gap analysis...")
    gap = compute_gap(resume_skills, jd_skills)

    # Step 6 — Generate roadmap (now returns JSON list)
    title_for_roadmap = job_title if job_title else "this role"
    print(f"[Pipeline] Generating roadmap for {len(gap['missing'])} missing skills...")
    roadmap = generate_roadmap(
        title_for_roadmap,
        gap["missing"],
        resume_skills=resume_skills,
        match_score=gap["match_score"]
    )

    return {
        "name": name,
        "resume_skills": resume_skills,
        "jd_skills": jd_skills,
        "match_score": gap["match_score"],
        "matched": gap["matched"],
        "missing": gap["missing"],
        "roadmap": roadmap  # now a list of dicts
    }


# --- STEP-BASED SSE STREAMING PIPELINE ---
def run_pipeline_steps(
    pdf_bytes: bytes,
    job_title: str = None,
    jd_text: str = None
) -> Generator[dict, None, None]:
    """
    Same as run_pipeline but yields SSE event dicts as each step completes.
    Each yielded dict has at minimum:
      {"type": "step", "step": N, "total": 5, "label": "..."}
    The final event is:
      {"type": "result", ...full result fields...}
    """
    if not job_title and not jd_text:
        raise ValueError("Provide either job_title or jd_text.")

    def step_event(n: int) -> dict:
        return {
            "type": "step",
            "step": n,
            "total": TOTAL_STEPS,
            "label": PIPELINE_STEPS[n - 1],
        }

    # ── Step 1: Parse PDF ──────────────────────────────────────────────────
    print("[Pipeline:stream] Parsing PDF...")
    resume_text = _parse_pdf(pdf_bytes)
    name = _extract_name(resume_text)
    print(f"[Pipeline:stream] Candidate: {name}")
    yield step_event(1)

    # ── Step 2: Extract resume skills ─────────────────────────────────────
    print("[Pipeline:stream] Extracting resume skills...")
    resume_skills = extract_skills_from_text(resume_text)
    print(f"[Pipeline:stream] Found {len(resume_skills)} resume skills.")
    yield step_event(2)

    # ── Step 3: Get JD skills ─────────────────────────────────────────────
    if jd_text:
        print("[Pipeline:stream] Extracting JD skills from pasted text...")
        jd_skills = extract_skills_from_text(jd_text)
    else:
        print(f"[Pipeline:stream] Predicting JD skills for: {job_title}...")
        jd_skills = predict_skills(job_title)
    print(f"[Pipeline:stream] Got {len(jd_skills)} JD skills.")
    yield step_event(3)

    # ── Step 4: Gap analysis / ATS score ─────────────────────────────────
    print("[Pipeline:stream] Running gap analysis...")
    gap = compute_gap(resume_skills, jd_skills)
    yield step_event(4)

    # ── Step 5: Generate roadmap ──────────────────────────────────────────
    title_for_roadmap = job_title if job_title else "this role"
    print(f"[Pipeline:stream] Generating roadmap for {len(gap['missing'])} missing skills...")
    roadmap = generate_roadmap(
        title_for_roadmap,
        gap["missing"],
        resume_skills=resume_skills,
        match_score=gap["match_score"]
    )
    yield step_event(5)

    # ── Final: emit full result ───────────────────────────────────────────
    yield {
        "type": "result",
        "name": name,
        "resume_skills": resume_skills,
        "jd_skills": jd_skills,
        "match_score": gap["match_score"],
        "matched": gap["matched"],
        "missing": gap["missing"],
        "roadmap": roadmap,
    }
