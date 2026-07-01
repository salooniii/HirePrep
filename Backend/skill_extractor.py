from sentence_transformers import SentenceTransformer, util
import re
import fitz

# load once at module level so it doesn't reload every call
try:
    import torch
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    model = SentenceTransformer('all-MiniLM-L6-v2', device=DEVICE)
    print(f"Skill Extractor (MiniLM) is ready and running on: {DEVICE.upper()}")
except Exception as e:
    print(f"Model load failed: {e}")

NOISE_WORDS = {
    'and', 'or', 'the', 'for', 'with', 'using', 'skills', 
    'libraries', 'projects', 'certification', 'education',
    'experience', 'tools', 'others', 'frameworks',
    'development skills', 'frontend developer', 'machine learning',
    'utilized python with libraries', 'python libraries such as numpy',
    'and python programming', 'and matplotlib to clean',
    # ── JD category labels that are NOT actual skills ──────────────────
    'backend', 'frontend', 'databases', 'database', 'testing',
    'development', 'development practices', 'required skills',
    'required', 'frontend exposure', 'backend development',
    'frontend development', 'soft skills', 'technical skills',
    'hard skills', 'core skills', 'key skills', 'must have',
    'nice to have', 'good to have', 'preferred', 'mandatory',
    'bonus', 'plus', 'responsibilities', 'requirements',
    'qualifications', 'duties', 'role', 'position', 'job',
    'knowledge', 'understanding', 'proficiency', 'familiarity',
    'exposure', 'basics', 'fundamentals', 'concepts',
}

NOISE_STARTS = {'and ', 'i ', 'while', 'built', 'such', 'improving', 'utilized', 'applying', 'designed', 'fitness', 'progress', 'blogs', 'trainers'}

LOCATION_INDICATORS = {
    'pune', 'maharashtra', 'mumbai', 'bangalore', 'delhi', 
    'aundh', 'warje', 'shivajinagar', 'india'
}

DEGREE_NOISE = {
    'higher secondary certificate', 'secondary school certificate',
    'hsc', 'ssc', 'cbse', 'sppu', 'bachelor of engineering'
}

LANGUAGE_NOISE = {
    'english', 'hindi', 'marathi', 'german', 'french', 
    'spanish', 'sanskrit', 'tamil', 'telugu'
}

INSTITUTION_WORDS = {'school', 'college', 'university', 'institute', 'academy', 'bhavan', 'vidya'}

SECTION_HEADERS = {
    'technical skills', 'certifications', 'certification',
    'projects', 'education', 'experience', 'skills',
    'work experience', 'extra-curricular activities',
    'profile summary', 'languages', 'developer tools',
    # ── JD section titles ──────────────────────────────────────────────
    'required skills', 'key skills', 'must have skills',
    'good to have', 'nice to have', 'preferred skills',
    'responsibilities', 'job requirements', 'qualifications',
    'what you will do', 'what we expect', 'role overview',
    'about the role', 'you will be', 'we are looking for',
}

CHUNK_NOISE = {
    'certifications', 'technical skills', 'education',
    'experience', 'projects', 'skills', 'work experience',
    'languages', 'extra-curricular activities'
}

SKILL_ANCHORS = [
    "programming language",
    "web framework",
    "database",
    "cloud platform",
    "machine learning library",
    "devops tool",
    "data analysis tool",
    "version control",
    "operating system",
    "software development skill",
    "frontend technology",
    "backend technology",
    "testing framework",
    "visualization tool",
    "natural language processing",
    "deep learning framework",
    "mobile development",
    "cybersecurity tool",
    "project management tool",
    "certification"
]

def is_skill_list(chunk):
    tokens = [t.strip() for t in chunk.split(',')]
    if len(tokens) >= 3:
        avg_len = sum(len(t) for t in tokens) / len(tokens)
        return avg_len < 15
    return False

def extract_skills_from_text(text: str) -> list:
    # step 1 — split into sentences/chunks
    chunks = [c.strip() for c in re.split(r'[\n]|(?<![a-zA-Z])\.(?![a-zA-Z])', text) if len(c.strip()) > 5]
    # split on newlines and periods
    print(f"Chunks found: {len(chunks)}")
    print(f"First chunk: {chunks[0] if chunks else 'NONE'}")
    # step 2 — embed all sentences at once (batch)
    chunk_embeddings = model.encode(chunks, convert_to_tensor=True)
    # step 3 — embed anchors
    anchor_embeddings = model.encode(SKILL_ANCHORS, convert_to_tensor=True)
    # step 4 — for each sentence compute max cosine sim to any anchor
    # Vectorized similarity matrix computation (takes ~0.001s instead of loop)
    similarity_matrix = util.cos_sim(chunk_embeddings, anchor_embeddings)
    max_sims = similarity_matrix.max(dim=1).values.cpu().numpy()

    skill_chunks = []
    for i, sim in enumerate(max_sims):
        if (sim > 0.50 or is_skill_list(chunks[i])) \
            and chunks[i].lower().strip() not in CHUNK_NOISE \
            and not any(d in chunks[i].lower() for d in DEGREE_NOISE) \
            and not any(loc in chunks[i].lower() for loc in LOCATION_INDICATORS):
            skill_chunks.append(chunks[i])
    # step 5 — from skill sentences extract tokens
    print(f"Skill chunks found: {len(skill_chunks)}")
    candidates = []
    for chunk in skill_chunks:
        tokens = re.split(r'[,\/|;]', chunk)
        for token in tokens:
            token = token.strip()
            # Normalize JD-style phrases like "work with X", "experience in X"
            token = re.sub(
                r'^(work(?:ing)?\s+with|experience\s+(?:in|with)|knowledge\s+of|'
                r'proficiency\s+in|familiar(?:ity)?\s+with|exposure\s+to|'
                r'understanding\s+of|hands.?on\s+(?:with|in)|ability\s+to|'
                r'good\s+understanding\s+of|strong\s+knowledge\s+of)\s+',
                '', token, flags=re.IGNORECASE
            ).strip()
            token = re.sub(r'^[\w\s]+:\s*', '', token).strip()
            token = re.sub(r'[()•]', '', token).strip()
            token = re.sub(r'\s+', ' ', token)
            if (len(token) > 2 
                and not token.isnumeric() 
                and len(token) < 40 
                and token.lower() not in NOISE_WORDS
                and token.lower() not in LANGUAGE_NOISE
                and token.lower() not in LOCATION_INDICATORS
                and not any(token.lower().startswith(n) for n in NOISE_STARTS)
                and token.lower() not in SECTION_HEADERS
                and not any(iw in token.lower() for iw in INSTITUTION_WORDS)):
                candidates.append(token.lower())
    # split on commas, slashes, pipes, semicolons
    # strip each token, filter tokens under 2 chars
    # filter tokens that are purely numeric
    all_noise = LOCATION_INDICATORS | DEGREE_NOISE | LANGUAGE_NOISE
    candidates = [c for c in candidates if c not in all_noise 
                  and not any(c.startswith(l) for l in LOCATION_INDICATORS)]
    # step 6 — deduplicate and return sorted list
    
    return sorted(list(set(candidates)))


