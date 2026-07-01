import requests
import json
from typing import Generator
from urllib.parse import quote_plus

# --- CONFIG ---
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2"

# Colour palette for roadmap week cards (cycles if more than 6 weeks)
WEEK_COLORS = ["#c94a3a", "#e8823a", "#7a2e18", "#4a1a08", "#b05a2a", "#8a3a1a"]


# --- RELIABLE URL GENERATOR ---
# The LLM is NOT asked to generate URLs (it hallucinates broken ones).
# Instead, we build guaranteed-working search URLs from the resource name.
def _generate_resource_url(skill: str, resource_name: str) -> str:
    """
    Converts a resource name + skill into a real, working URL.
    Uses search endpoints of trusted platforms — these never return 404.
    """
    r = resource_name.lower()
    skill_q = quote_plus(skill)
    resource_q = quote_plus(resource_name)

    if "youtube" in r:
        return f"https://www.youtube.com/results?search_query={skill_q}+tutorial"
    elif "coursera" in r:
        return f"https://www.coursera.org/search?query={skill_q}"
    elif "udemy" in r:
        return f"https://www.udemy.com/courses/search/?q={skill_q}"
    elif "freecodecamp" in r or "fcc" in r or "free code camp" in r:
        return f"https://www.freecodecamp.org/news/search/?query={skill_q}"
    elif "geeksforgeeks" in r or "gfg" in r:
        return f"https://www.geeksforgeeks.org/search/?q={skill_q}"
    elif "w3schools" in r:
        return f"https://www.w3schools.com/search/search_result.asp?q={skill_q}"
    elif "mdn" in r or "mozilla" in r:
        return f"https://developer.mozilla.org/en-US/search?q={skill_q}"
    elif "github" in r:
        return f"https://github.com/search?q={skill_q}&type=repositories"
    elif "leetcode" in r:
        return f"https://leetcode.com/problemset/?search={skill_q}"
    elif "hackerrank" in r:
        return f"https://www.hackerrank.com/domains/{skill_q}"
    elif "kaggle" in r:
        return f"https://www.kaggle.com/search?q={skill_q}"
    elif "official" in r or "documentation" in r or "docs" in r:
        return f"https://www.google.com/search?q={skill_q}+official+documentation"
    elif "book" in r or "oreilly" in r or "manning" in r:
        return f"https://www.google.com/search?q={resource_q}+free+pdf"
    elif "medium" in r or "blog" in r or "article" in r:
        return f"https://medium.com/search?q={skill_q}"
    elif "pluralsight" in r:
        return f"https://www.pluralsight.com/search?q={skill_q}"
    elif "edx" in r:
        return f"https://www.edx.org/search?q={skill_q}"
    elif "codecademy" in r:
        return f"https://www.codecademy.com/search?query={skill_q}"
    elif "roadmap" in r or "roadmap.sh" in r:
        return f"https://roadmap.sh"
    else:
        # Default fallback: YouTube search — always works
        return f"https://www.youtube.com/results?search_query={skill_q}+tutorial+for+beginners"


def _inject_urls_and_colors(weeks: list) -> list:
    """
    Post-process roadmap weeks:
    - Assign brand colors
    - Replace any LLM-generated resourceUrl with a reliable search URL
    """
    for i, week in enumerate(weeks):
        week["color"] = WEEK_COLORS[i % len(WEEK_COLORS)]

        # Get the primary skill for this week to build a good search URL
        skills = week.get("skills", [])
        primary_skill = skills[0] if skills else week.get("theme", "programming")
        resource_name = week.get("resource", "")

        # Always overwrite resourceUrl with our safe generated URL
        week["resourceUrl"] = _generate_resource_url(primary_skill, resource_name)

    return weeks


# --- PROMPT BUILDER ---
def _build_prompt(
    job_title: str,
    missing_skills: list,
    resume_skills: list = None,
    match_score: float = None
) -> str:
    missing_str = ", ".join(missing_skills)
    existing_str = ", ".join(resume_skills) if resume_skills else "Not provided"
    score_str = f"{match_score}%" if match_score is not None else "Not calculated"
    num_weeks = min(max(len(missing_skills), 2), 6)

    return f"""You are a career coach AI. A candidate is targeting the role of {job_title}.
Their resume already has these skills: {existing_str}.
They are MISSING these required skills: {missing_str}.
Their current ATS match score is {score_str}.

Generate a structured {num_weeks}-week learning roadmap to close the skill gap.

CRITICAL: Respond with ONLY a valid JSON array — no markdown, no explanation, no code fences.
Each element in the array must have exactly these fields:
{{
  "week": "Week N",
  "theme": "short theme name (3-5 words)",
  "goal": "one sentence describing the weekly goal",
  "skills": ["skill focus 1", "skill focus 2", "skill focus 3"],
  "resource": "Name of a well-known FREE platform or resource (e.g. YouTube, freeCodeCamp, Coursera, GeeksforGeeks, W3Schools, MDN, Codecademy, official documentation)",
  "milestone": "one concrete hands-on project to complete by end of week",
  "outcomes": ["checkable outcome 1", "checkable outcome 2"]
}}

Rules:
- Pick skills only from the missing list above.
- For "resource", name ONLY the platform (e.g. "YouTube", "freeCodeCamp", "Coursera") — do NOT include any URL.
- Be specific and actionable.
- Output ONLY the JSON array, starting with [ and ending with ].
"""


def _parse_roadmap_json(raw: str) -> list:
    """
    Extract and parse the JSON array from Ollama output.
    Handles cases where the model wraps it in markdown or adds extra text.
    """
    start = raw.find("[")
    end = raw.rfind("]")
    if start == -1 or end == -1 or end <= start:
        return _fallback_roadmap()

    json_str = raw[start:end + 1]
    try:
        weeks = json.loads(json_str)
        if isinstance(weeks, list) and len(weeks) > 0:
            return _inject_urls_and_colors(weeks)
    except json.JSONDecodeError:
        pass

    return _fallback_roadmap()


def _fallback_roadmap() -> list:
    """Returns a minimal fallback roadmap if JSON parsing fails."""
    return [
        {
            "week": "Week 1",
            "theme": "Foundation Building",
            "goal": "Build foundational knowledge for the target role.",
            "skills": ["Review job requirements", "Set up learning environment"],
            "resource": "freeCodeCamp",
            "resourceUrl": "https://www.freecodecamp.org",
            "milestone": "Complete an introductory project",
            "outcomes": ["Understood core concepts", "Set up development environment"],
            "color": "#c94a3a",
        }
    ]


# --- NON-STREAMING (returns structured roadmap as list of dicts) ---
def generate_roadmap(
    job_title: str,
    missing_skills: list,
    resume_skills: list = None,
    match_score: float = None
) -> list:
    """
    Calls Ollama and waits for the full response.
    Returns a list of week dicts (JSON roadmap) with verified URLs.
    """
    if not missing_skills:
        return [
            {
                "week": "Week 1",
                "theme": "You're Ready!",
                "goal": "You already have all the required skills for this role.",
                "skills": ["Polish your portfolio", "Prepare for interviews"],
                "resource": "Glassdoor Interview Questions",
                "resourceUrl": "https://www.glassdoor.com/Interview/index.htm",
                "milestone": "Apply to 5 relevant job postings",
                "outcomes": ["Portfolio updated", "Applied to target companies"],
                "color": "#2ecc71",
            }
        ]

    payload = {
        "model": MODEL_NAME,
        "prompt": _build_prompt(job_title, missing_skills, resume_skills, match_score),
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=300)
        response.raise_for_status()
        raw = response.json().get("response", "")
        return _parse_roadmap_json(raw)
    except requests.exceptions.ConnectionError:
        return _fallback_roadmap()
    except requests.exceptions.Timeout:
        return _fallback_roadmap()
    except Exception:
        return _fallback_roadmap()


# --- STREAMING (kept for backward compatibility) ---
def generate_roadmap_stream(
    job_title: str,
    missing_skills: list,
    resume_skills: list = None,
    match_score: float = None
) -> Generator[str, None, None]:
    """
    Streams raw tokens from Ollama.
    DEPRECATED: Step-based streaming is now handled in main.py.
    """
    if not missing_skills:
        yield "[]"
        return

    payload = {
        "model": MODEL_NAME,
        "prompt": _build_prompt(job_title, missing_skills, resume_skills, match_score),
        "stream": True
    }

    try:
        with requests.post(OLLAMA_URL, json=payload, stream=True, timeout=300) as response:
            response.raise_for_status()
            for line in response.iter_lines():
                if line:
                    chunk = json.loads(line)
                    token = chunk.get("response", "")
                    if token:
                        yield token
                    if chunk.get("done", False):
                        break
    except requests.exceptions.ConnectionError:
        yield "[]"
    except Exception:
        yield "[]"


# --- HEALTH CHECK ---
def is_ollama_running() -> bool:
    """Quick check to see if Ollama server is up before making a generation call."""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=3)
        return response.status_code == 200
    except Exception:
        return False
