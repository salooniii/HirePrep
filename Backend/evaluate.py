"""
evaluate.py — Model Evaluation Suite for HirePrepAI
====================================================
Evaluates all three core ML models:
  1. all-MiniLM-L6-v2      (Skill Extractor)
  2. BAAI/bge-base-en-v1.5 (Gap Scorer / Semantic Matcher)
  3. jd-skill-predictor    (DistilBERT Job Title → Skills Predictor)

Accessible at GET /evaluate via FastAPI.
"""

import time
import torch
import numpy as np
from sentence_transformers import SentenceTransformer, util

# ─── Shared device ────────────────────────────────────────────────────────────
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# ─── Test Fixtures ────────────────────────────────────────────────────────────

# Sample resume snippet for MiniLM skill extraction test
SAMPLE_RESUME_TEXT = """
Technical Skills:
Programming Languages: Python, Java, JavaScript, TypeScript
Frameworks: Spring Boot, React.js, FastAPI, Node.js
Databases: MySQL, PostgreSQL, MongoDB
Tools: Git, Docker, Postman, VS Code
Cloud: AWS EC2, S3
Testing: JUnit 5, Mockito, Pytest

Experience:
Developed RESTful APIs using Spring Boot and FastAPI.
Built responsive UIs with React and TypeScript.
Deployed services on AWS EC2 using Docker containers.
"""

# Known skill pairs for semantic similarity (bge-base)
MATCHING_PAIRS = [
    ("spring boot", "spring framework"),
    ("machine learning", "ml"),
    ("python", "python programming"),
    ("node.js", "nodejs"),
    ("react", "react.js"),
    ("postgresql", "postgres"),
    ("docker", "containerization"),
    ("restful apis", "rest-based services"),
]

NON_MATCHING_PAIRS = [
    ("java", "photoshop"),
    ("machine learning", "microsoft word"),
    ("docker", "cooking"),
    ("react", "accounting"),
    ("sql", "guitar"),
]

# Job titles for DistilBERT predictor test
TEST_JOB_TITLES = [
    "Software Engineer",
    "Data Scientist",
    "Full Stack Developer",
    "DevOps Engineer",
    "Machine Learning Engineer",
    "Backend Developer",
    "Frontend Developer",
    "Cloud Architect",
]


# ─── Model 1: MiniLM Skill Extractor ─────────────────────────────────────────

def evaluate_minilm() -> dict:
    """
    Evaluates the all-MiniLM-L6-v2 Sentence Transformer used for skill extraction.
    Tests: model metadata, inference latency, skill anchor similarity, extraction quality.
    """
    result = {
        "model": "all-MiniLM-L6-v2",
        "role": "Resume Skill Extractor",
        "device": DEVICE.upper(),
    }

    try:
        t0 = time.perf_counter()
        model = SentenceTransformer("all-MiniLM-L6-v2", device=DEVICE)
        load_time = round((time.perf_counter() - t0) * 1000, 1)

        # --- Latency: single sentence embedding ---
        sample_sentences = [
            "python programming language",
            "spring boot framework",
            "machine learning with tensorflow",
            "docker containerization and kubernetes",
            "restful api development",
        ]
        t0 = time.perf_counter()
        embeddings = model.encode(sample_sentences, convert_to_tensor=True)
        latency_batch = round((time.perf_counter() - t0) * 1000, 1)
        latency_per_sentence = round(latency_batch / len(sample_sentences), 1)

        # --- Skill anchor similarity test ---
        skill_anchors = [
            "programming language",
            "web framework",
            "database",
            "devops tool",
            "testing framework",
            "cloud platform",
        ]
        anchor_embeddings = model.encode(skill_anchors, convert_to_tensor=True)
        sim_matrix = util.cos_sim(embeddings, anchor_embeddings).cpu().numpy()
        max_sims = sim_matrix.max(axis=1).tolist()
        avg_anchor_sim = round(float(np.mean(max_sims)), 4)

        # --- Embedding dimension ---
        embedding_dim = embeddings.shape[1]

        # --- Skill extraction spot-check on sample resume ---
        from skill_extractor import extract_skills_from_text
        t0 = time.perf_counter()
        extracted_skills = extract_skills_from_text(SAMPLE_RESUME_TEXT)
        extraction_time = round((time.perf_counter() - t0) * 1000, 1)

        # Check known skills are captured
        expected_skills = ["python", "java", "spring boot", "react", "docker", "postgresql", "mysql", "aws ec2"]
        found = [s for s in expected_skills if s in extracted_skills]
        precision_spot = round(len(found) / len(expected_skills) * 100, 1)

        result.update({
            "status": "ok",
            "load_time_ms": load_time,
            "embedding_dimension": embedding_dim,
            "batch_inference_ms": latency_batch,
            "latency_per_sentence_ms": latency_per_sentence,
            "avg_anchor_similarity": avg_anchor_sim,
            "skill_extraction": {
                "extraction_time_ms": extraction_time,
                "skills_extracted": len(extracted_skills),
                "sample_skills": extracted_skills[:15],
                "expected_skills_found": found,
                "spot_check_recall_pct": precision_spot,
            },
            "anchor_similarity_breakdown": [
                {"sentence": s, "max_sim_to_anchor": round(float(m), 4)}
                for s, m in zip(sample_sentences, max_sims)
            ],
        })

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)

    return result


# ─── Model 2: BAAI/bge-base Semantic Gap Scorer ───────────────────────────────

def evaluate_bge() -> dict:
    """
    Evaluates the BAAI/bge-base-en-v1.5 embedder used for semantic skill matching.
    Tests: matching pairs (should be HIGH similarity), non-matching pairs (should be LOW).
    """
    result = {
        "model": "BAAI/bge-base-en-v1.5",
        "role": "Semantic Gap Scorer / Skill Matcher",
        "device": DEVICE.upper(),
        "threshold_used": 0.72,
    }

    try:
        t0 = time.perf_counter()
        model = SentenceTransformer("BAAI/bge-base-en-v1.5", device=DEVICE)
        load_time = round((time.perf_counter() - t0) * 1000, 1)

        embedding_dim = model.encode(["test"], convert_to_tensor=True).shape[1]

        # --- Latency test ---
        all_skills = ["python", "java", "spring boot", "react", "docker", "postgresql",
                      "aws", "kubernetes", "fastapi", "machine learning"]
        t0 = time.perf_counter()
        emb = model.encode(all_skills, convert_to_tensor=True)
        latency = round((time.perf_counter() - t0) * 1000, 1)

        # --- Matching pair test (expect HIGH similarity ≥ 0.72) ---
        matching_results = []
        correct_matches = 0
        for a, b in MATCHING_PAIRS:
            ea = model.encode([a], convert_to_tensor=True)
            eb = model.encode([b], convert_to_tensor=True)
            sim = float(util.cos_sim(ea, eb)[0][0])
            passed = sim >= 0.72
            if passed:
                correct_matches += 1
            matching_results.append({
                "skill_a": a,
                "skill_b": b,
                "similarity": round(sim, 4),
                "should_match": True,
                "correctly_matched": passed,
            })

        # --- Non-matching pair test (expect LOW similarity < 0.72) ---
        non_matching_results = []
        correct_non_matches = 0
        for a, b in NON_MATCHING_PAIRS:
            ea = model.encode([a], convert_to_tensor=True)
            eb = model.encode([b], convert_to_tensor=True)
            sim = float(util.cos_sim(ea, eb)[0][0])
            passed = sim < 0.72
            if passed:
                correct_non_matches += 1
            non_matching_results.append({
                "skill_a": a,
                "skill_b": b,
                "similarity": round(sim, 4),
                "should_match": False,
                "correctly_rejected": passed,
            })

        # --- Aggregate metrics ---
        match_accuracy = round(correct_matches / len(MATCHING_PAIRS) * 100, 1)
        non_match_accuracy = round(correct_non_matches / len(NON_MATCHING_PAIRS) * 100, 1)
        overall_accuracy = round(
            (correct_matches + correct_non_matches) /
            (len(MATCHING_PAIRS) + len(NON_MATCHING_PAIRS)) * 100, 1
        )

        avg_matching_sim = round(
            float(np.mean([r["similarity"] for r in matching_results])), 4
        )
        avg_non_matching_sim = round(
            float(np.mean([r["similarity"] for r in non_matching_results])), 4
        )

        result.update({
            "status": "ok",
            "load_time_ms": load_time,
            "embedding_dimension": embedding_dim,
            "batch_inference_ms": latency,
            "accuracy": {
                "matching_pairs_correct_pct": match_accuracy,
                "non_matching_pairs_rejected_pct": non_match_accuracy,
                "overall_accuracy_pct": overall_accuracy,
            },
            "similarity_stats": {
                "avg_similarity_matching_pairs": avg_matching_sim,
                "avg_similarity_non_matching_pairs": avg_non_matching_sim,
                "separation_gap": round(avg_matching_sim - avg_non_matching_sim, 4),
            },
            "matching_pair_results": matching_results,
            "non_matching_pair_results": non_matching_results,
        })

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)

    return result


# ─── Model 3: DistilBERT JD Skill Predictor ──────────────────────────────────

def evaluate_distilbert() -> dict:
    """
    Evaluates the fine-tuned DistilBERT multi-label classifier for job skill prediction.
    Tests: inference latency, skill count per title, consistency, and known skill presence.
    """
    result = {
        "model": "jd-skill-predictor (DistilBERT fine-tuned)",
        "role": "Job Title → Required Skills Predictor",
        "device": DEVICE.upper(),
        "model_path": "jd-skill-predictor/",
        "threshold": 0.3,
        "top_k": 20,
    }

    try:
        from predict_skill import predict_skills

        # --- Known skill expectations per role ---
        EXPECTED_SKILLS = {
            "Software Engineer":        ["python", "java", "git", "sql"],
            "Data Scientist":           ["python", "machine learning", "sql", "statistics"],
            "Full Stack Developer":     ["javascript", "react", "node.js", "sql"],
            "DevOps Engineer":          ["docker", "kubernetes", "aws", "linux"],
            "Machine Learning Engineer":["python", "machine learning", "tensorflow", "pytorch"],
        }

        title_results = []
        total_latency = 0
        total_recall = 0
        titles_tested = 0

        for title in TEST_JOB_TITLES:
            t0 = time.perf_counter()
            predicted = predict_skills(title)
            latency = round((time.perf_counter() - t0) * 1000, 1)
            total_latency += latency

            entry = {
                "job_title": title,
                "inference_time_ms": latency,
                "skills_predicted": len(predicted),
                "predicted_skills": predicted,
            }

            # Spot-check recall for titles we have expectations for
            if title in EXPECTED_SKILLS:
                expected = EXPECTED_SKILLS[title]
                found = [e for e in expected if any(e in p or p in e for p in predicted)]
                recall = round(len(found) / len(expected) * 100, 1)
                total_recall += recall
                titles_tested += 1
                entry["expected_skills_check"] = {
                    "expected": expected,
                    "found_in_predictions": found,
                    "recall_pct": recall,
                }

            title_results.append(entry)

        # --- Consistency test: same title → same output ---
        t0 = time.perf_counter()
        pred1 = predict_skills("Software Engineer")
        pred2 = predict_skills("Software Engineer")
        consistency_time = round((time.perf_counter() - t0) * 1000, 1)
        is_consistent = pred1 == pred2

        avg_latency = round(total_latency / len(TEST_JOB_TITLES), 1)
        avg_recall = round(total_recall / titles_tested, 1) if titles_tested > 0 else 0
        avg_skills = round(
            sum(r["skills_predicted"] for r in title_results) / len(title_results), 1
        )

        result.update({
            "status": "ok",
            "avg_inference_time_ms": avg_latency,
            "avg_skills_predicted_per_title": avg_skills,
            "consistency_test": {
                "consistent_output": is_consistent,
                "double_inference_time_ms": consistency_time,
            },
            "avg_recall_on_known_roles_pct": avg_recall,
            "per_title_results": title_results,
        })

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)

    return result


# ─── Master Evaluation Runner ─────────────────────────────────────────────────

def run_full_evaluation() -> dict:
    """
    Runs evaluation for all three models and returns a combined report.
    Called by the /evaluate FastAPI endpoint.
    """
    started_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    t_total = time.perf_counter()

    report = {
        "report": "HirePrepAI Model Evaluation",
        "generated_at": started_at,
        "hardware": {
            "cuda_available": torch.cuda.is_available(),
            "device": DEVICE.upper(),
            "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        },
    }

    print("[Eval] Evaluating MiniLM (Skill Extractor)...")
    report["minilm_skill_extractor"] = evaluate_minilm()

    print("[Eval] Evaluating BAAI/bge (Gap Scorer)...")
    report["bge_gap_scorer"] = evaluate_bge()

    print("[Eval] Evaluating DistilBERT (JD Predictor)...")
    report["distilbert_jd_predictor"] = evaluate_distilbert()

    total_time = round((time.perf_counter() - t_total) * 1000, 1)
    report["total_evaluation_time_ms"] = total_time

    # Overall summary
    statuses = [
        report["minilm_skill_extractor"].get("status"),
        report["bge_gap_scorer"].get("status"),
        report["distilbert_jd_predictor"].get("status"),
    ]

    active_scores = []
    if report["minilm_skill_extractor"].get("status") == "ok":
        active_scores.append(report["minilm_skill_extractor"].get("skill_extraction", {}).get("spot_check_recall_pct", 0))
    if report["bge_gap_scorer"].get("status") == "ok":
        active_scores.append(report["bge_gap_scorer"].get("accuracy", {}).get("overall_accuracy_pct", 0))
    if report["distilbert_jd_predictor"].get("status") == "ok":
        active_scores.append(report["distilbert_jd_predictor"].get("avg_recall_on_known_roles_pct", 0))

    overall_score = round(sum(active_scores) / len(active_scores), 1) if active_scores else 0

    report["summary"] = {
        "models_evaluated": 3,
        "all_passed": all(s == "ok" for s in statuses),
        "overall_score": overall_score,
        "statuses": {
            "minilm": report["minilm_skill_extractor"].get("status"),
            "bge": report["bge_gap_scorer"].get("status"),
            "distilbert": report["distilbert_jd_predictor"].get("status"),
        },
    }

    print(f"[Eval] Done. Total time: {total_time}ms")
    return report
