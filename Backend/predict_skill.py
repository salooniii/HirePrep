import torch
import pickle
import numpy as np
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification

# --- CONFIG ---
MODEL_PATH = "jd-skill-predictor"
MLB_PATH = "mlb.pkl"
MAX_LEN = 64
THRESHOLD = 0.3
TOP_K = 20

# Auto-detect GPU, fall back to CPU silently
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"JD Predictor using device: {DEVICE.type.upper()}")

# --- LOAD ---
print("Loading model...")
tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_PATH)
model = DistilBertForSequenceClassification.from_pretrained(MODEL_PATH)
model.to(DEVICE)
model.eval()

with open(MLB_PATH, "rb") as f:
    mlb = pickle.load(f)

print(f"JD Predictor (DistilBERT) model is ready and running on: {DEVICE.type.upper()}")

# --- INFERENCE ---
def predict_skills(job_title: str, top_k: int = TOP_K) -> list:
    inputs = tokenizer(
        job_title,
        return_tensors="pt",
        truncation=True,
        padding="max_length",
        max_length=MAX_LEN
    ).to(DEVICE)

    with torch.no_grad():
        logits = model(**inputs).logits

    probs = torch.sigmoid(logits).cpu().numpy()[0]
    indices = np.where(probs >= THRESHOLD)[0]

    if len(indices) < 5:
        indices = np.argsort(probs)[::-1][:top_k]

    skills = mlb.classes_[indices]
    scores = probs[indices]
    ranked = sorted(zip(skills, scores), key=lambda x: x[1], reverse=True)
    return [s for s, _ in ranked[:top_k]]