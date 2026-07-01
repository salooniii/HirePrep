"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";

// ─── Data ─────────────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  {
    num: "01",
    color: "#c94a3a",
    icon: "📄",
    title: "PDF Upload & Text Extraction",
    subtitle: "PyMuPDF (fitz)",
    tech: ["FastAPI", "PyMuPDF", "Python"],
    description:
      "The user uploads their resume as a PDF file. FastAPI receives it as a multipart form upload. PyMuPDF (fitz) reads the binary content page by page, extracting text blocks while intelligently handling both single-column and multi-column resume layouts using x-coordinate thresholds.",
    detail:
      "Block sorting ensures left-column content (skills, experience) is prioritised over right-column decorations. The raw extracted text is then fed into the NLP pipeline.",
    output: "Clean raw text string from all resume pages",
  },
  {
    num: "02",
    color: "#e8823a",
    icon: "🧠",
    title: "Resume Skill Extraction",
    subtitle: "all-MiniLM-L6-v2 · Sentence Transformers",
    tech: ["MiniLM", "Sentence Transformers", "PyTorch", "CUDA/CPU"],
    description:
      "The resume text is split into chunks (sentences / newlines). Each chunk is embedded into a 384-dimensional vector using all-MiniLM-L6-v2. These are compared via cosine similarity against 20 skill anchor phrases like 'programming language', 'web framework', 'devops tool'.",
    detail:
      "Chunks scoring above 0.50 cosine similarity to any anchor are kept. They are then tokenised on commas, slashes and pipes. Each token passes through a noise filter (50+ banned words, location names, degree names, JD category labels) before being added to the final skill list.",
    output: "Deduplicated list of candidate's skills e.g. ['python', 'spring boot', 'docker']",
  },
  {
    num: "03",
    color: "#b05a2a",
    icon: "🎯",
    title: "Job Skill Extraction (Two Paths)",
    subtitle: "DistilBERT -or- MiniLM depending on user input",
    tech: ["DistilBERT", "MiniLM", "MultiLabelBinarizer", "1M+ job postings dataset"],
    description:
      "If the user provides a Job Title, the fine-tuned DistilBERT multi-label classifier predicts required skills from the title text. If the user pastes a Job Description, the same MiniLM pipeline used for the resume runs on the JD text to extract skills directly.",
    detail:
      "DistilBERT was fine-tuned on 1,048,571 real job postings with 20+ skills per row. It predicts the top-20 skills using a confidence threshold of 0.3. A JD-specific noise filter then removes category headers like 'backend', 'required skills', 'testing' that aren't real skill tokens.",
    output: "List of role-required skills e.g. ['java', 'spring boot', 'hibernate', 'postgresql']",
    split: true,
  },
  {
    num: "04",
    color: "#8a3a1a",
    icon: "⚖️",
    title: "Semantic Skill Gap Scoring",
    subtitle: "BAAI/bge-base-en-v1.5 · Cosine Similarity",
    tech: ["BAAI/bge", "Sentence Transformers", "NumPy", "CUDA/CPU"],
    description:
      "Both skill lists (resume + JD) are normalised — preamble phrases like 'work with', 'experience in', 'proficiency in' are stripped before embedding. Both lists are then encoded into 768-dimensional vectors using BAAI/bge-base-en-v1.5.",
    detail:
      "A cosine similarity matrix [jd × resume] is computed. For each JD skill, the best matching resume skill is found. If similarity ≥ 0.72, it's counted as matched. Below that, it's listed as missing. The match score = matched / total JD skills × 100.",
    output: "{ match_score: 83%, matched: [...], missing: ['cloud deployment'] }",
  },
  {
    num: "05",
    color: "#7a2e18",
    icon: "📊",
    title: "ATS Score Calculation",
    subtitle: "Rule-based Weighted Scoring",
    tech: ["Python", "Rule Engine", "Keyword Analysis"],
    description:
      "A rule-based ATS scorer evaluates the resume independently of the job role. It checks for keyword presence, resume section completeness (skills, experience, education, contact info), resume length, formatting signals and skill coverage relative to the JD.",
    detail:
      "Each rule contributes a weighted score. The final ATS score reflects how well the resume would survive automated screening systems used by companies before a human reviewer sees it.",
    output: "ATS score (0–100) with breakdown by category",
  },
  {
    num: "06",
    color: "#4a1a08",
    icon: "🗺️",
    title: "Personalised Learning Roadmap",
    subtitle: "llama3.2 via Ollama · Local LLM",
    tech: ["Ollama", "llama3.2", "JSON prompting", "URL generator"],
    description:
      "The missing skills list, match score and existing skills are sent as a structured prompt to the locally-running llama3.2 model via Ollama. The model is instructed to respond with ONLY a JSON array — no markdown, no freetext.",
    detail:
      "Each week entry has: theme, goal, skills focus, resource (platform name only — never a URL), milestone, and outcomes. After parsing, a Python URL generator converts the platform name into a guaranteed-working search URL (e.g. 'freeCodeCamp' → freecodecamp.org/news/search/?query=skill). This prevents hallucinated 404 links.",
    output: "Array of 2–6 week objects with goals, resources and milestones",
  },
  {
    num: "07",
    color: "#c94a3a",
    icon: "📡",
    title: "SSE Streaming to Frontend",
    subtitle: "Server-Sent Events · FastAPI StreamingResponse",
    tech: ["FastAPI", "SSE", "Next.js", "EventSource API"],
    description:
      "Instead of waiting for the full pipeline to complete, the backend yields step-progress events as each stage finishes. FastAPI wraps the generator in a StreamingResponse with media_type='text/event-stream'.",
    detail:
      "The frontend opens an SSE connection and processes events: {'type':'step', 'step':N} triggers the circular animation to advance. The final {'type':'result'} event carries the full JSON payload. Results are stored in a Zustand store and the user is redirected to the results page.",
    output: "5 step events → 1 result event → redirect to /results",
  },
];

const MODELS = [
  {
    name: "all-MiniLM-L6-v2",
    type: "Sentence Transformer",
    role: "Skill Extractor",
    color: "#c94a3a",
    params: "22M",
    dim: "384",
    use: "Embeds resume/JD text chunks and compares them to skill anchors using cosine similarity. Also used for JD text skill extraction when the user pastes a description.",
    tags: ["Skill Extraction", "JD Parsing", "Cosine Similarity", "CUDA/CPU"],
  },
  {
    name: "BAAI/bge-base-en-v1.5",
    type: "Bi-Encoder · Sentence Transformer",
    role: "Gap Scorer",
    color: "#e8823a",
    params: "109M",
    dim: "768",
    use: "Encodes both resume and JD skill lists into high-quality 768-dim embeddings. Builds a similarity matrix to find matches above a 0.72 threshold. Higher dimensional space means more nuanced semantic understanding.",
    tags: ["Gap Scoring", "Semantic Matching", "Skill Comparison", "CUDA/CPU"],
  },
  {
    name: "jd-skill-predictor",
    type: "DistilBERT · Fine-tuned",
    role: "Job Title → Skills",
    color: "#2ecc71",
    params: "66M",
    dim: "768",
    use: "Fine-tuned on 1,048,571 job postings with 20+ skills per row. Takes a job title string and multi-label classifies which skills are required for that role. Uses a 0.3 confidence threshold with top-20 selection.",
    tags: ["Multi-label Classification", "Job Title Input", "1M Dataset", "CUDA/CPU"],
  },
  {
    name: "llama3.2",
    type: "Large Language Model · Local",
    role: "Roadmap Generator",
    color: "#b05a2a",
    params: "3B",
    dim: "—",
    use: "Runs locally via Ollama. Given missing skills, match score and existing skills, generates a structured JSON learning roadmap. Explicitly instructed to output only JSON — no markdown. Resource URLs are generated by Python code, not the model.",
    tags: ["Roadmap", "JSON Output", "Ollama", "Local LLM"],
  },
];

const TECH_STACK = [
  { cat: "Backend", items: ["FastAPI", "Python 3.11", "PyMuPDF", "PyTorch", "Uvicorn"] },
  { cat: "ML / NLP", items: ["Sentence Transformers", "HuggingFace Transformers", "scikit-learn", "NumPy"] },
  { cat: "LLM", items: ["Ollama", "llama3.2", "JSON prompting"] },
  { cat: "Frontend", items: ["Next.js 16", "TypeScript", "Framer Motion", "Zustand"] },
  { cat: "Data", items: ["1M job postings CSV", "MultiLabelBinarizer", "DistilBERT fine-tune"] },
  { cat: "Infrastructure", items: ["SSE Streaming", "CUDA GPU", "CPU fallback", "CORS"] },
];

// ─── Animated section wrapper ─────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HowItWorksPage() {
  const router = useRouter();

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", overflowX: "hidden" }}>
      {/* Dot grid */}
      <div className={cn("fixed inset-0 [background-size:22px_22px] [background-image:radial-gradient(#222_1px,transparent_1px)]")} style={{ zIndex: 0, opacity: 0.6 }} />
      <div className="fixed pointer-events-none inset-0 bg-[var(--bg-primary)] [mask-image:radial-gradient(ellipse_at_center,transparent_35%,black)]" style={{ zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2 }}>

        {/* ── Navbar ── */}
        <nav style={{ height: "64px", display: "flex", alignItems: "center", padding: "0 32px", borderBottom: "1px solid var(--border)", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(8,8,8,0.85)", backdropFilter: "blur(12px)", zIndex: 50 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "18px", color: "var(--text-cream)", letterSpacing: "-0.03em", cursor: "pointer" }} onClick={() => router.push("/")}>
            HirePrep <span style={{ color: "var(--accent-red)" }}>AI.</span>
          </span>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <ThemeToggle size={34} />
            <button onClick={() => router.push("/performance")} style={{ fontFamily: "var(--font-mono)", fontSize: "12px", padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
              ⚡ Performance
            </button>
            <button onClick={() => router.push("/upload")} style={{ fontFamily: "var(--font-mono)", fontSize: "12px", padding: "8px 16px", borderRadius: "6px", border: "none", background: "var(--accent-red)", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
              Analyse Resume →
            </button>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{ padding: "96px 32px 64px", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.2em", color: "var(--accent-red)", textTransform: "uppercase", margin: "0 0 20px" }}>
            End-to-End Architecture
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }}
            style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "clamp(36px,6vw,72px)", color: "var(--text-cream)", letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 24px" }}>
            How HirePrepAI
            <br />
            <span style={{ color: "var(--accent-red)" }}>Actually Works</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}
            style={{ fontFamily: "var(--font-mono)", fontSize: "15px", color: "var(--text-muted)", lineHeight: 1.7, margin: "0 auto", maxWidth: "620px" }}>
            A complete breakdown of every model, every API call and every data transformation — from PDF upload to personalised learning roadmap.
          </motion.p>

          {/* Flow pills */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginTop: "40px" }}>
            {["PDF Upload", "→", "MiniLM", "→", "DistilBERT / MiniLM", "→", "BAAI/bge", "→", "ATS Scorer", "→", "llama3.2", "→", "SSE Stream"].map((p, i) => (
              <span key={i} style={{
                fontFamily: "var(--font-mono)", fontSize: "11px",
                padding: p === "→" ? "0 2px" : "5px 12px",
                borderRadius: "6px",
                background: p === "→" ? "transparent" : "rgba(255,255,255,0.05)",
                border: p === "→" ? "none" : "1px solid var(--border)",
                color: p === "→" ? "var(--text-muted)" : "var(--text-cream)",
              }}>{p}</span>
            ))}
          </motion.div>
        </section>

        {/* ── Pipeline Timeline ── */}
        <section style={{ padding: "0 32px 80px", maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", textAlign: "center", margin: "0 0 64px" }}>
              — Pipeline Walkthrough —
            </p>
          </Reveal>

          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div style={{ position: "absolute", left: "31px", top: "24px", bottom: "24px", width: "2px", background: "linear-gradient(to bottom, var(--accent-red), #4a1a08, var(--accent-red))", opacity: 0.3 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
              {PIPELINE_STEPS.map((step, i) => (
                <Reveal key={step.num} delay={0.05}>
                  <div style={{ display: "flex", gap: "32px", paddingBottom: "56px" }}>
                    {/* Step number circle */}
                    <div style={{ flexShrink: 0, width: "64px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}
                        style={{ width: "64px", height: "64px", borderRadius: "50%", background: `linear-gradient(135deg, ${step.color}33, ${step.color}11)`, border: `2px solid ${step.color}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                        {step.icon}
                      </motion.div>
                    </div>

                    {/* Content card */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
                      style={{ flex: 1, background: "var(--bg-secondary)", border: `1px solid ${step.color}33`, borderRadius: "12px", padding: "24px 28px" }}>

                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: step.color, letterSpacing: "0.15em" }}>STEP {step.num}</span>
                          <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "20px", color: "var(--text-cream)", letterSpacing: "-0.02em", margin: "4px 0 2px" }}>{step.title}</h2>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: step.color, margin: 0, opacity: 0.9 }}>{step.subtitle}</p>
                        </div>
                        {step.split && (
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "3px 10px", borderRadius: "999px", background: "rgba(46,204,113,0.1)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.25)" }}>PATH A: Job Title</span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>or</span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "3px 10px", borderRadius: "999px", background: "rgba(201,74,58,0.1)", color: "var(--accent-red)", border: "1px solid rgba(201,74,58,0.25)" }}>PATH B: JD Text</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.75, margin: "0 0 12px" }}>{step.description}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 16px", opacity: 0.7 }}>{step.detail}</p>

                      {/* Output */}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: step.color, letterSpacing: "0.15em" }}>OUTPUT → </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-cream)" }}>{step.output}</span>
                      </div>

                      {/* Tech tags */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {step.tech.map((t, j) => (
                          <span key={j} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "3px 10px", borderRadius: "4px", background: `${step.color}14`, color: step.color, border: `1px solid ${step.color}30` }}>{t}</span>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Models Deep-dive ── */}
        <section style={{ padding: "0 32px 80px", maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 12px" }}>AI Models</p>
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "clamp(28px,4vw,48px)", color: "var(--text-cream)", letterSpacing: "-0.03em", margin: 0 }}>
                The Models Behind the Magic
              </h2>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: "16px" }}>
            {MODELS.map((m, i) => (
              <Reveal key={m.name} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4, borderColor: `${m.color}66` }}
                  transition={{ duration: 0.2 }}
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", height: "100%", boxSizing: "border-box" }}>

                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "4px 10px", borderRadius: "999px", background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}35` }}>
                      {m.role}
                    </span>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", margin: "0 0 2px" }}>PARAMS</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "14px", color: m.color, margin: 0 }}>{m.params}</p>
                    </div>
                  </div>

                  <h3 style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "14px", color: "var(--text-cream)", margin: "0 0 4px", letterSpacing: "-0.01em" }}>{m.name}</h3>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", margin: "0 0 14px" }}>{m.type} · Dim: {m.dim}</p>

                  <div style={{ width: "100%", height: "1px", background: "var(--border)", margin: "0 0 14px" }} />

                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 16px" }}>{m.use}</p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {m.tags.map((t, j) => (
                      <span key={j} style={{ fontFamily: "var(--font-mono)", fontSize: "9px", padding: "2px 8px", borderRadius: "3px", background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{t}</span>
                    ))}
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Data Flow Diagram (text-based) ── */}
        <section style={{ padding: "0 32px 80px", maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 12px" }}>Data Flow</p>
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "clamp(24px,3.5vw,40px)", color: "var(--text-cream)", letterSpacing: "-0.03em", margin: 0 }}>
                Full System at a Glance
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "36px", overflowX: "auto" }}>
              <div style={{ minWidth: "600px" }}>
                {/* User */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                  <div style={{ padding: "10px 20px", background: "rgba(201,74,58,0.12)", border: "1px solid rgba(201,74,58,0.3)", borderRadius: "8px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--accent-red)", whiteSpace: "nowrap" }}>
                    👤 User
                  </div>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)", position: "relative" }}>
                    <span style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>PDF + Job Title / JD Text</span>
                  </div>
                  <div style={{ padding: "10px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "8px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-cream)", whiteSpace: "nowrap" }}>
                    🌐 Next.js Frontend
                  </div>
                </div>

                {/* Arrow down */}
                <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: "80px", marginBottom: "6px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>POST /analyze</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "18px" }}>↓</span>
                  </div>
                </div>

                {/* FastAPI box */}
                <div style={{ border: "1px solid rgba(232,130,58,0.4)", borderRadius: "12px", padding: "20px", background: "rgba(232,130,58,0.05)", marginBottom: "12px" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#e8823a", letterSpacing: "0.12em", margin: "0 0 14px" }}>FastAPI Backend · Pipeline Orchestrator</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: "10px" }}>
                    {[
                      { label: "PyMuPDF", sub: "PDF → text" },
                      { label: "MiniLM", sub: "Resume skills" },
                      { label: "DistilBERT / MiniLM", sub: "JD skills" },
                      { label: "BAAI/bge", sub: "Gap score" },
                      { label: "ATS Scorer", sub: "Rule-based" },
                      { label: "Ollama llama3.2", sub: "Roadmap JSON" },
                    ].map((b, i) => (
                      <div key={i} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-cream)", margin: "0 0 2px", fontWeight: 700 }}>{b.label}</p>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", margin: 0 }}>{b.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arrow down */}
                <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: "80px", marginBottom: "6px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>SSE events + result JSON</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "18px" }}>↓</span>
                  </div>
                </div>

                {/* Frontend result */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ padding: "10px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "8px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-cream)", whiteSpace: "nowrap" }}>
                    🌐 Next.js Frontend
                  </div>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)", position: "relative" }}>
                    <span style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Score · Skills · Roadmap</span>
                  </div>
                  <div style={{ padding: "10px 20px", background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.25)", borderRadius: "8px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "#2ecc71", whiteSpace: "nowrap" }}>
                    👤 User sees results
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Tech Stack ── */}
        <section style={{ padding: "0 32px 80px", maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 12px" }}>Technology</p>
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "clamp(24px,3.5vw,40px)", color: "var(--text-cream)", letterSpacing: "-0.03em", margin: 0 }}>
                Full Stack
              </h2>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "12px" }}>
            {TECH_STACK.map((cat, i) => (
              <Reveal key={cat.cat} delay={i * 0.06}>
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px 18px" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.15em", color: "var(--accent-red)", textTransform: "uppercase", margin: "0 0 10px" }}>{cat.cat}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {cat.items.map((item, j) => (
                      <span key={j} style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>· {item}</span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <Reveal>
          <section style={{ padding: "0 32px 120px", textAlign: "center" }}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", margin: "0 0 20px" }}>
                Ready to see it in action?
              </p>
              <button
                onClick={() => router.push("/upload")}
                style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "16px", padding: "16px 40px", background: "var(--accent-red)", border: "none", borderRadius: "999px", color: "#fff", cursor: "pointer", letterSpacing: "-0.01em" }}>
                Analyse My Resume →
              </button>
            </motion.div>
          </section>
        </Reveal>

      </div>
    </main>
  );
}
