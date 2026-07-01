import numpy as np
from sentence_transformers import SentenceTransformer, util
import torch
import re

# --- CONFIG ---
SEMANTIC_THRESHOLD = 0.72  # Slightly relaxed: handles phrase vs exact term ("work with spring data jpa" vs "spring data jpa")
MODEL_NAME = "BAAI/bge-base-en-v1.5"

# Auto-detect GPU, fall back to CPU silently
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Gap Scorer using device: {DEVICE.upper()}")
print("Loading embedder...")
embedder = SentenceTransformer(MODEL_NAME, device=DEVICE)
print(f"Gap Scorer embedder (BAAI/bge) is ready and running on: {DEVICE.upper()}")


def _normalize_skill(skill: str) -> str:
    """
    Strip JD-style preamble phrases before embedding to improve match accuracy.
    e.g. "work with spring data jpa" → "spring data jpa"
         "experience in kubernetes"  → "kubernetes"
    """
    skill = skill.strip().lower()
    skill = re.sub(
        r'^(work(?:ing)?\s+with|experience\s+(?:in|with)|knowledge\s+of|'
        r'proficiency\s+in|familiar(?:ity)?\s+with|exposure\s+to|'
        r'understanding\s+of|hands.?on\s+(?:with|in)|ability\s+to|'
        r'good\s+understanding\s+of|strong\s+knowledge\s+of)\s+',
        '', skill, flags=re.IGNORECASE
    ).strip()
    return skill


def compute_gap(resume_skills: list, jd_skills: list) -> dict:
    """
    Semantically compares resume skills against JD required skills.
    Returns match %, matched skills (with jd/resume/score keys), and missing skills.
    """
    if not resume_skills or not jd_skills:
        return {
            "match_score": 0.0,
            "matched": [],
            "missing": jd_skills,
            "resume_skills": resume_skills
        }

    # Normalize both skill lists before embedding
    normalized_resume = [_normalize_skill(s) for s in resume_skills]
    normalized_jd    = [_normalize_skill(s) for s in jd_skills]

    # Embed normalized versions for better cosine similarity
    resume_embeddings = embedder.encode(normalized_resume, convert_to_tensor=True)
    jd_embeddings     = embedder.encode(normalized_jd,     convert_to_tensor=True)

    # For each JD skill find best matching resume skill
    similarity_matrix = util.cos_sim(jd_embeddings, resume_embeddings)  # [jd x resume]

    matched = []
    missing = []

    for i, jd_skill in enumerate(jd_skills):
        best_score = similarity_matrix[i].max().item()
        best_idx   = similarity_matrix[i].argmax().item()

        if best_score >= SEMANTIC_THRESHOLD:
            matched.append({
                "jd":     jd_skill,                   # original JD skill label
                "resume": resume_skills[best_idx],     # original resume skill label
                "score":  round(best_score, 3)
            })
        else:
            missing.append(jd_skill)

    match_score = round(len(matched) / len(jd_skills) * 100, 2)

    return {
        "match_score":    match_score,
        "matched":        matched,
        "missing":        missing,
        "resume_skills":  resume_skills,
    }