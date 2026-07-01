"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnchorSim { sentence: string; max_sim_to_anchor: number; }
interface MatchingPair { skill_a: string; skill_b: string; similarity: number; should_match: boolean; correctly_matched?: boolean; correctly_rejected?: boolean; }
interface TitleResult { job_title: string; inference_time_ms: number; skills_predicted: number; predicted_skills: string[]; expected_skills_check?: { expected: string[]; found_in_predictions: string[]; recall_pct: number }; }

interface MiniLMResult {
  model: string; role: string; device: string; status: string; error?: string;
  load_time_ms: number; embedding_dimension: number;
  batch_inference_ms: number; latency_per_sentence_ms: number;
  avg_anchor_similarity: number;
  skill_extraction: { extraction_time_ms: number; skills_extracted: number; sample_skills: string[]; expected_skills_found: string[]; spot_check_recall_pct: number; };
  anchor_similarity_breakdown: AnchorSim[];
}
interface BGEResult {
  model: string; role: string; device: string; status: string; error?: string;
  threshold_used: number; load_time_ms: number; embedding_dimension: number;
  batch_inference_ms: number;
  accuracy: { matching_pairs_correct_pct: number; non_matching_pairs_rejected_pct: number; overall_accuracy_pct: number; };
  similarity_stats: { avg_similarity_matching_pairs: number; avg_similarity_non_matching_pairs: number; separation_gap: number; };
  matching_pair_results: MatchingPair[];
  non_matching_pair_results: MatchingPair[];
}
interface DistilBERTResult {
  model: string; role: string; device: string; status: string; error?: string;
  avg_inference_time_ms: number; avg_skills_predicted_per_title: number;
  consistency_test: { consistent_output: boolean; double_inference_time_ms: number; };
  avg_recall_on_known_roles_pct: number;
  per_title_results: TitleResult[];
}
interface EvalReport {
  report: string; generated_at: string;
  hardware: { cuda_available: boolean; device: string; gpu_name: string | null; };
  minilm_skill_extractor: MiniLMResult;
  bge_gap_scorer: BGEResult;
  distilbert_jd_predictor: DistilBERTResult;
  summary: { models_evaluated: number; all_passed: boolean; statuses: Record<string, string>; overall_score?: number; };
  total_evaluation_time_ms: number;
}

// ─── Shared design components ─────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--bg-secondary)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "20px 24px",
      ...style,
    }}>
      {children}
    </div>
  );
}

function Label({ children, color = "var(--accent-red)" }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.15em", color, textTransform: "uppercase", margin: "0 0 10px" }}>
      {children}
    </p>
  );
}

function Stat({ label, value, color = "var(--text-cream)", sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", margin: 0, letterSpacing: "0.08em" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "22px", fontWeight: 800, color, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", margin: 0 }}>{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === "ok";
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700,
      padding: "3px 10px", borderRadius: "999px", letterSpacing: "0.1em",
      background: ok ? "rgba(46,204,113,0.12)" : "rgba(201,74,58,0.15)",
      color: ok ? "#2ecc71" : "var(--accent-red)",
      border: `1px solid ${ok ? "rgba(46,204,113,0.3)" : "rgba(201,74,58,0.3)"}`,
    }}>
      {ok ? "● PASSING" : "✕ ERROR"}
    </span>
  );
}

function MiniBar({ value, max = 100, color = "var(--accent-red)" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden", flex: 1 }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
        style={{ height: "100%", background: color, borderRadius: "2px" }}
      />
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
      <div style={{ width: "3px", height: "16px", background: "var(--accent-red)", borderRadius: "2px" }} />
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {children}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PerformancePage() {
  const router = useRouter();
  const [report, setReport] = useState<EvalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/evaluate`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => { setReport(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [API_URL]);

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "0" }}>
      {/* Dot grid background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, backgroundSize: "20px 20px", backgroundImage: "radial-gradient(var(--dot-color) 1px, transparent 1px)" }} />
      <div className="pointer-events-none absolute inset-0 bg-[var(--bg-primary)] [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)]" style={{ zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Navbar */}
        <nav style={{ height: "64px", display: "flex", alignItems: "center", padding: "0 32px", borderBottom: "1px solid var(--border)", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "18px", color: "var(--text-cream)", letterSpacing: "-0.03em", cursor: "pointer" }}
            onClick={() => router.push("/")}>
            HirePrep <span style={{ color: "var(--accent-red)" }}>AI.</span>
          </span>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <ThemeToggle size={34} />
            <button onClick={() => router.push("/upload")} style={{ fontFamily: "var(--font-mono)", fontSize: "12px", padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
              New Analysis
            </button>
          </div>
        </nav>

        {/* Page Header */}
        <div style={{ padding: "40px 32px 24px", maxWidth: "1440px", margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.15em", color: "var(--accent-red)", textTransform: "uppercase", margin: "0 0 10px" }}>
              Model Evaluation
            </p>
            <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "clamp(24px,3vw,40px)", color: "var(--text-cream)", letterSpacing: "-0.03em", margin: "0 0 8px" }}>
              System Performance
            </h1>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              Live evaluation of all ML models powering HirePrepAI — latency, accuracy and semantic quality.
            </p>
          </motion.div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: "80px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTop: "3px solid var(--accent-red)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>
              Running model evaluations… this may take 30–90 seconds
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ padding: "32px", maxWidth: "640px", margin: "0 auto" }}>
            <Card>
              <Label color="var(--accent-red)">Connection Error</Label>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "16px", color: "var(--text-cream)", margin: "0 0 8px" }}>
                Could not reach the backend
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", margin: "0 0 16px" }}>
                {error} — Make sure the FastAPI server is running at {API_URL}
              </p>
              <button onClick={() => { setLoading(true); setError(null); fetch(`${API_URL}/evaluate`).then(r => r.json()).then(d => { setReport(d); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); }); }}
                style={{ fontFamily: "var(--font-mono)", fontSize: "12px", padding: "8px 20px", borderRadius: "6px", background: "var(--accent-red)", border: "none", color: "#fff", cursor: "pointer" }}>
                Retry
              </button>
            </Card>
          </div>
        )}

        {/* Report */}
        {report && !loading && (() => {
          const minilmScore = report.minilm_skill_extractor?.status === "ok" ? report.minilm_skill_extractor.skill_extraction.spot_check_recall_pct : 0;
          const bgeScore = report.bge_gap_scorer?.status === "ok" ? report.bge_gap_scorer.accuracy.overall_accuracy_pct : 0;
          const distilbertScore = report.distilbert_jd_predictor?.status === "ok" ? report.distilbert_jd_predictor.avg_recall_on_known_roles_pct : 0;
          const computedOverall = report.summary.overall_score ?? parseFloat(((minilmScore + bgeScore + distilbertScore) / 3).toFixed(1));

          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
              style={{ padding: "0 32px 48px", maxWidth: "1440px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Overall Project Accuracy Hero Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ width: "100%" }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(201, 74, 58, 0.1) 0%, var(--bg-secondary) 100%)",
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    padding: "32px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "32px",
                    alignItems: "center",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Glow Effect */}
                  <div
                    style={{
                      position: "absolute",
                      top: "-50%",
                      left: "-30%",
                      width: "80%",
                      height: "180%",
                      background: "radial-gradient(ellipse at center, rgba(201, 74, 58, 0.08) 0%, transparent 70%)",
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  />

                  {/* Left Side: Circular Gauge and Score */}
                  <div style={{ display: "flex", alignItems: "center", gap: "24px", zIndex: 1 }}>
                    <div style={{ position: "relative", width: "120px", height: "120px", flexShrink: 0 }}>
                      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                        {/* Background circle */}
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="transparent"
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeWidth="8"
                        />
                        {/* Foreground animated path */}
                        <motion.circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="transparent"
                          stroke="var(--accent-red)"
                          strokeWidth="8"
                          strokeDasharray={2 * Math.PI * 52}
                          initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - computedOverall / 100) }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: "28px", fontWeight: 800, color: "var(--text-cream)" }}>
                          {computedOverall}%
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                          ACCURACY
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label color="var(--accent-red)">System Metric</Label>
                      <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "24px", color: "var(--text-cream)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                        Overall System Accuracy
                      </h2>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                        The consolidated metric of accuracy across all NLP, embeddings, and classification models powering the analysis pipeline.
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Component Breakdown Progress Bars */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", zIndex: 1 }}>
                    <SectionHeader>Model Contributions</SectionHeader>
                    {[
                      { name: "MiniLM Skill Extractor (Recall)", value: minilmScore, color: "#2ecc71" },
                      { name: "BGE Gap Scorer (Semantic Accuracy)", value: bgeScore, color: "var(--accent-orange)" },
                      { name: "DistilBERT JD Predictor (Recall)", value: distilbertScore, color: "#9b59b6" }
                    ].map((model, idx) => (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-cream)" }}>
                            {model.name}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: model.color }}>
                            {model.value}%
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <MiniBar value={model.value} color={model.color} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Summary Banner */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "16px" }}>
              {[
                { label: "Models Tested", value: report.summary.models_evaluated, color: "var(--text-cream)" },
                { label: "All Passing", value: report.summary.all_passed ? "YES" : "NO", color: report.summary.all_passed ? "#2ecc71" : "var(--accent-red)" },
                { label: "Hardware", value: report.hardware.device, color: "var(--accent-orange)", sub: report.hardware.gpu_name ?? "CPU only" },
                { label: "Total Eval Time", value: `${(report.total_evaluation_time_ms / 1000).toFixed(1)}s`, color: "var(--text-cream)" },
                { label: "Report Generated", value: new Date(report.generated_at).toLocaleTimeString(), color: "var(--text-muted)" },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <Card><Stat label={s.label} value={s.value} color={s.color} sub={s.sub} /></Card>
                </motion.div>
              ))}
            </div>

            {/* ── MODEL 1: MiniLM ── */}
            {report.minilm_skill_extractor && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                      <Label>Model 01 — Skill Extractor</Label>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "18px", color: "var(--text-cream)", margin: "0 0 4px" }}>
                        {report.minilm_skill_extractor.model}
                      </p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                        {report.minilm_skill_extractor.role} · Device: {report.minilm_skill_extractor.device}
                      </p>
                    </div>
                    <StatusBadge status={report.minilm_skill_extractor.status} />
                  </div>

                  {report.minilm_skill_extractor.status === "ok" && (() => {
                    const m = report.minilm_skill_extractor;
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))", gap: "20px" }}>
                        {/* Stats */}
                        <div>
                          <SectionHeader>Performance Metrics</SectionHeader>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            {[
                              { label: "Load Time", value: `${m.load_time_ms}ms` },
                              { label: "Latency / Sentence", value: `${m.latency_per_sentence_ms}ms` },
                              { label: "Embedding Dim", value: m.embedding_dimension },
                              { label: "Avg Anchor Similarity", value: (m.avg_anchor_similarity * 100).toFixed(1) + "%" },
                            ].map((s, i) => (
                              <div key={i} style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", margin: "0 0 4px" }}>{s.label}</p>
                                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "18px", color: "var(--text-cream)", margin: 0 }}>{s.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Skill Extraction */}
                        <div>
                          <SectionHeader>Extraction Quality</SectionHeader>
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Spot-check Recall</span>
                              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "16px", color: m.skill_extraction.spot_check_recall_pct >= 75 ? "#2ecc71" : "var(--accent-orange)" }}>
                                {m.skill_extraction.spot_check_recall_pct}%
                              </span>
                            </div>
                            <MiniBar value={m.skill_extraction.spot_check_recall_pct} color="#2ecc71" />
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                              {m.skill_extraction.skills_extracted} skills extracted from sample resume in {m.skill_extraction.extraction_time_ms}ms
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                              {m.skill_extraction.sample_skills.slice(0, 12).map((s, i) => (
                                <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "3px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Anchor Similarity bars */}
                        <div style={{ gridColumn: "1 / -1" }}>
                          <SectionHeader>Anchor Similarity Breakdown</SectionHeader>
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {m.anchor_similarity_breakdown.map((a, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", minWidth: "220px", flexShrink: 0 }}>{a.sentence}</span>
                                <MiniBar value={a.max_sim_to_anchor * 100} color="var(--accent-red)" />
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", minWidth: "36px", textAlign: "right" }}>
                                  {(a.max_sim_to_anchor * 100).toFixed(0)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {report.minilm_skill_extractor.status === "error" && (
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-red)", margin: 0 }}>{report.minilm_skill_extractor.error}</p>
                  )}
                </Card>
              </motion.div>
            )}

            {/* ── MODEL 2: BGE ── */}
            {report.bge_gap_scorer && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                      <Label color="var(--accent-orange)">Model 02 — Semantic Gap Scorer</Label>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "18px", color: "var(--text-cream)", margin: "0 0 4px" }}>
                        {report.bge_gap_scorer.model}
                      </p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                        {report.bge_gap_scorer.role} · Threshold: {report.bge_gap_scorer.threshold_used} · Device: {report.bge_gap_scorer.device}
                      </p>
                    </div>
                    <StatusBadge status={report.bge_gap_scorer.status} />
                  </div>

                  {report.bge_gap_scorer.status === "ok" && (() => {
                    const b = report.bge_gap_scorer;
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: "20px" }}>
                        {/* Accuracy */}
                        <div>
                          <SectionHeader>Accuracy Metrics</SectionHeader>
                          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {[
                              { label: "Overall Accuracy", value: b.accuracy.overall_accuracy_pct, color: "#2ecc71" },
                              { label: "Matching Pairs Correct", value: b.accuracy.matching_pairs_correct_pct, color: "#2ecc71" },
                              { label: "Non-matches Rejected", value: b.accuracy.non_matching_pairs_rejected_pct, color: "var(--accent-orange)" },
                            ].map((m, i) => (
                              <div key={i}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>{m.label}</span>
                                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "14px", color: m.color }}>{m.value}%</span>
                                </div>
                                <MiniBar value={m.value} color={m.color} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Similarity stats */}
                        <div>
                          <SectionHeader>Similarity Statistics</SectionHeader>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            {[
                              { label: "Avg Matching Sim", value: (b.similarity_stats.avg_similarity_matching_pairs * 100).toFixed(1) + "%", color: "#2ecc71" },
                              { label: "Avg Non-match Sim", value: (b.similarity_stats.avg_similarity_non_matching_pairs * 100).toFixed(1) + "%", color: "var(--accent-red)" },
                              { label: "Separation Gap", value: (b.similarity_stats.separation_gap * 100).toFixed(1) + "%", color: "var(--accent-orange)" },
                              { label: "Embedding Dim", value: b.embedding_dimension, color: "var(--text-cream)" },
                            ].map((s, i) => (
                              <div key={i} style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", margin: "0 0 4px" }}>{s.label}</p>
                                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "16px", color: s.color, margin: 0 }}>{s.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Pair-by-pair results */}
                        <div style={{ gridColumn: "1 / -1" }}>
                          <SectionHeader>Skill Pair Test Results</SectionHeader>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px" }}>
                            {[...b.matching_pair_results, ...b.non_matching_pair_results].map((p, i) => {
                              const passed = p.should_match ? p.correctly_matched : p.correctly_rejected;
                              return (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: `1px solid ${passed ? "rgba(46,204,113,0.2)" : "rgba(201,74,58,0.2)"}` }}>
                                  <span style={{ fontSize: "11px" }}>{passed ? "✅" : "❌"}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-cream)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {p.skill_a} ↔ {p.skill_b}
                                    </p>
                                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", margin: 0 }}>
                                      {p.should_match ? "should match" : "should differ"}
                                    </p>
                                  </div>
                                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: passed ? "#2ecc71" : "var(--accent-red)", flexShrink: 0, fontWeight: 700 }}>
                                    {(p.similarity * 100).toFixed(0)}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {report.bge_gap_scorer.status === "error" && (
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-red)", margin: 0 }}>{report.bge_gap_scorer.error}</p>
                  )}
                </Card>
              </motion.div>
            )}

            {/* ── MODEL 3: DistilBERT ── */}
            {report.distilbert_jd_predictor && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                      <Label color="#2ecc71">Model 03 — JD Skill Predictor</Label>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "18px", color: "var(--text-cream)", margin: "0 0 4px" }}>
                        {report.distilbert_jd_predictor.model}
                      </p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                        {report.distilbert_jd_predictor.role} · Device: {report.distilbert_jd_predictor.device}
                      </p>
                    </div>
                    <StatusBadge status={report.distilbert_jd_predictor.status} />
                  </div>

                  {report.distilbert_jd_predictor.status === "ok" && (() => {
                    const d = report.distilbert_jd_predictor;
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: "20px" }}>
                        {/* Summary stats */}
                        <div>
                          <SectionHeader>Performance Metrics</SectionHeader>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            {[
                              { label: "Avg Latency", value: `${d.avg_inference_time_ms}ms`, color: "var(--text-cream)" },
                              { label: "Avg Skills / Title", value: d.avg_skills_predicted_per_title, color: "var(--text-cream)" },
                              { label: "Avg Recall", value: `${d.avg_recall_on_known_roles_pct}%`, color: d.avg_recall_on_known_roles_pct >= 70 ? "#2ecc71" : "var(--accent-orange)" },
                              { label: "Consistent Output", value: d.consistency_test.consistent_output ? "YES" : "NO", color: d.consistency_test.consistent_output ? "#2ecc71" : "var(--accent-red)" },
                            ].map((s, i) => (
                              <div key={i} style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", margin: "0 0 4px" }}>{s.label}</p>
                                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "18px", color: s.color, margin: 0 }}>{s.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Per-title breakdown */}
                        <div style={{ gridColumn: "1 / -1" }}>
                          <SectionHeader>Per Job Title Results</SectionHeader>
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {d.per_title_results.map((t, i) => (
                              <div key={i} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "13px", color: "var(--text-cream)" }}>{t.job_title}</span>
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>{t.skills_predicted} skills · {t.inference_time_ms}ms</span>
                                    {t.expected_skills_check && (
                                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "2px 8px", borderRadius: "999px", background: "rgba(46,204,113,0.1)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.2)" }}>
                                        {t.expected_skills_check.recall_pct}% recall
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                                  {t.predicted_skills.slice(0, 12).map((s, j) => (
                                    <span key={j} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "2px 7px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{s}</span>
                                  ))}
                                  {t.predicted_skills.length > 12 && (
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", padding: "2px 0" }}>+{t.predicted_skills.length - 12} more</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {report.distilbert_jd_predictor.status === "error" && (
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-red)", margin: 0 }}>{report.distilbert_jd_predictor.error}</p>
                  )}
                </Card>
              </motion.div>
            )}
          </motion.div>
          );
        })()}
      </div>
    </main>
  );
}
