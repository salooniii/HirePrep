import os
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
import pandas as pd
import numpy as np
import torch
import re
import os
import pickle
from torch.utils.data import Dataset, DataLoader
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification
from torch.optim import AdamW
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.model_selection import train_test_split
from tqdm import tqdm
from torch.cuda.amp import autocast, GradScaler
scaler = GradScaler()

# --- CONFIG ---
CSV_PATH = "final_dataset.csv"
MODEL_SAVE_PATH = "jd-skill-predictor"
MLB_SAVE_PATH = "mlb.pkl"
MAX_LEN = 64        # job titles are short, 64 is enough
BATCH_SIZE = 32     # safe for 8GB VRAM
EPOCHS = 3
LR = 2e-5
THRESHOLD = 0.3     # confidence threshold for inference
TOP_N_SKILLS = 2000   # only keep skills that appear in at least 50 rows

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE}")
torch.backends.cudnn.benchmark = True

# --- STEP 1: LOAD & CLEAN ---
print("Loading dataset...")
df = pd.read_csv(CSV_PATH, usecols=["job_title", "job_skills"])
df = df.dropna(subset=["job_title", "job_skills"])
print(f"Rows loaded: {len(df)}")

def clean_title(title):
    title = str(title).lower().strip()
    title = re.sub(r'\s*[-–|]\s*\w[\w\s]*\d+\w*', '', title)  # strip suffixes like - Huntington 4131
    title = re.sub(r'\s*(pt|ft|part.time|full.time|remote|onsite|hybrid)\s*$', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s+', ' ', title).strip()
    return title

def parse_skills(skill_str):
    skills = [s.strip().lower() for s in str(skill_str).split(',')]
    return [s for s in skills if len(s) > 1]

df["job_title"] = df["job_title"].apply(clean_title)
df["skill_list"] = df["job_skills"].apply(parse_skills)
df = df[df["skill_list"].map(len) > 0]
df = df[df["job_title"].str.len() > 2]

# --- STEP 2: FILTER RARE SKILLS ---
print("Building skill vocabulary...")
from collections import Counter
all_skills = [skill for sublist in df["skill_list"] for skill in sublist]
skill_counts = Counter(all_skills)
common_skills = {skill for skill, count in skill_counts.items() if count >= TOP_N_SKILLS}
print(f"Vocabulary size (skills appearing >= {TOP_N_SKILLS} times): {len(common_skills)}")

df["skill_list"] = df["skill_list"].apply(lambda skills: [s for s in skills if s in common_skills])
df = df[df["skill_list"].map(len) > 0]
print(f"Rows after filtering rare skills: {len(df)}")

# --- STEP 3: MULTI-HOT ENCODE ---
mlb = MultiLabelBinarizer()
labels = mlb.fit_transform(df["skill_list"]).astype(np.float32)
print(f"Label shape: {labels.shape}")

# save mlb for inference
with open(MLB_SAVE_PATH, "wb") as f:
    pickle.dump(mlb, f)
print(f"MLB saved to {MLB_SAVE_PATH}")

# --- STEP 4: TRAIN/VAL SPLIT ---
titles = df["job_title"].tolist()
X_train, X_val, y_train, y_val = train_test_split(
    titles, labels, test_size=0.1, random_state=42
)
print(f"Train: {len(X_train)} | Val: {len(X_val)}")

# --- STEP 5: DATASET CLASS ---
tokenizer = DistilBertTokenizerFast.from_pretrained("distilbert-base-uncased")

class JDDataset(Dataset):
    def __init__(self, titles, labels):
        self.titles = titles
        self.labels = torch.tensor(labels, dtype=torch.float32)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        encoding = tokenizer(
            self.titles[idx],
            truncation=True,
            padding="max_length",
            max_length=MAX_LEN,
            return_tensors="pt"
        )
        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "labels": self.labels[idx]
        }


train_dataset = JDDataset(X_train, y_train)
val_dataset = JDDataset(X_val, y_val)

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)

# --- STEP 6: MODEL ---
num_labels = labels.shape[1]
model = DistilBertForSequenceClassification.from_pretrained(
    "distilbert-base-uncased",
    num_labels=num_labels,
    problem_type="multi_label_classification"
)
model.to(DEVICE)

optimizer = AdamW(model.parameters(), lr=LR)
loss_fn = torch.nn.BCEWithLogitsLoss()

# --- STEP 7: TRAINING LOOP ---
print("Starting training...")
for epoch in range(EPOCHS):
    model.train()
    total_loss = 0
    for batch in tqdm(train_loader, desc=f"Epoch {epoch+1}/{EPOCHS}"):
        input_ids = batch["input_ids"].to(DEVICE)
        attention_mask = batch["attention_mask"].to(DEVICE)
        labels_batch = batch["labels"].to(DEVICE)

        optimizer.zero_grad()
        with autocast():
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            loss = loss_fn(outputs.logits, labels_batch)
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
        total_loss += loss.item()

    avg_loss = total_loss / len(train_loader)

    # --- VALIDATION ---
    model.eval()
    val_loss = 0
    with torch.no_grad():
        for batch in val_loader:
            input_ids = batch["input_ids"].to(DEVICE)
            attention_mask = batch["attention_mask"].to(DEVICE)
            labels_batch = batch["labels"].to(DEVICE)
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            val_loss += loss_fn(outputs.logits, labels_batch).item()

    print(f"Epoch {epoch+1} | Train Loss: {avg_loss:.4f} | Val Loss: {val_loss/len(val_loader):.4f}")

# --- STEP 8: SAVE ---
model.save_pretrained(MODEL_SAVE_PATH)
tokenizer.save_pretrained(MODEL_SAVE_PATH)
print(f"Model saved to {MODEL_SAVE_PATH}/")

# --- STEP 9: QUICK INFERENCE TEST ---
def predict_skills(job_title, top_k=20):
    model.eval()
    inputs = tokenizer(job_title, return_tensors="pt", truncation=True,
                       padding="max_length", max_length=MAX_LEN).to(DEVICE)
    with torch.no_grad():
        logits = model(**inputs).logits
    probs = torch.sigmoid(logits).cpu().numpy()[0]
    indices = np.where(probs >= THRESHOLD)[0]
    skills = mlb.classes_[indices]
    scores = probs[indices]
    ranked = sorted(zip(skills, scores), key=lambda x: x[1], reverse=True)
    return [s for s, _ in ranked[:top_k]]

print("\n--- Inference Test ---")
test_titles = ["software engineer", "data scientist", "frontend developer", "devops engineer"]
for title in test_titles:
    print(f"\n{title}: {predict_skills(title)}")