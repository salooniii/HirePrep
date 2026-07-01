"""
supabase_client.py — Supabase integration for HirePrepAI
=========================================================
Handles saving analysis results to the analysis_history table.
Uses service role key to bypass RLS (server-side only — never expose this key in the frontend).
"""

import os
from supabase import create_client, Client

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env"
            )
        _client = create_client(url, key)
    return _client


def save_analysis(user_id: str, job_title: str, result: dict) -> None:
    """
    Saves an analysis result to the analysis_history table for a signed-in user.
    Called server-side by main.py after a successful /analyze run.

    Args:
        user_id:   The Supabase Auth UUID of the signed-in user.
        job_title: The job title or a short label for this analysis.
        result:    The full pipeline result dict (match_score, skills, roadmap, etc.)
    """
    try:
        client = get_client()
        client.table("analysis_history").insert({
            "user_id": user_id,
            "job_title": job_title or "Untitled Analysis",
            "match_score": int(result.get("match_score", 0)),   # cast float → int
            "resume_skills": result.get("resume_skills", []),
            "jd_skills": result.get("jd_skills", []),
            "missing": result.get("missing", []),
            "matched": result.get("matched", []),
            "roadmap": result.get("roadmap", []),
        }).execute()
        print(f"[Supabase] Saved analysis for user {user_id[:8]}...")
    except Exception as e:
        # Non-fatal — guest analysis still works even if DB save fails
        print(f"[Supabase] WARNING: Failed to save analysis: {e}")
