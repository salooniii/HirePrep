"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/store/authStore";
import { useResultStore } from "@/store/resultStore";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthButton from "@/components/ui/AuthButton";

// ─── Types ────────────────────────────────────────────────────────────────────
interface HistoryEntry {
  id: string;
  created_at: string;
  job_title: string;
  match_score: number;
  resume_skills: string[];
  jd_skills: string[];
  missing: string[];
  matched: object[];
  roadmap: object[];
}

// ─── Score Color ──────────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 75) return "#2ecc71";
  if (score >= 50) return "var(--accent-orange)";
  return "var(--accent-red)";
}

// ─── Mini Score Arc ───────────────────────────────────────────────────────────
function ScoreArc({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = scoreColor(score);
  return (
    <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="36" cy="36" r={r} fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <motion.circle
          cx="36" cy="36" r={r}
          fill="transparent" stroke={color} strokeWidth="6"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "15px", color }}>{score}%</span>
      </div>
    </div>
  );
}

// ─── History Card ─────────────────────────────────────────────────────────────
function HistoryCard({ entry, onClick }: { entry: HistoryEntry; onClick: () => void }) {
  const date = new Date(entry.created_at);
  const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: "20px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        transition: "border-color 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-red)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <ScoreArc score={entry.match_score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-red)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 4px" }}>
            {dateStr} · {timeStr}
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "15px", color: "var(--text-cream)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {entry.job_title}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
            {entry.resume_skills?.length ?? 0} resume skills · {entry.missing?.length ?? 0} gaps
          </p>
        </div>
      </div>

      {/* Missing skills preview */}
      {entry.missing?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {entry.missing.slice(0, 5).map((s, i) => (
            <span key={i} style={{
              fontFamily: "var(--font-mono)", fontSize: "10px",
              padding: "2px 8px", borderRadius: "4px",
              background: "rgba(201,74,58,0.1)", color: "var(--accent-red)",
              border: "1px solid rgba(201,74,58,0.2)",
            }}>{s}</span>
          ))}
          {entry.missing.length > 5 && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
              +{entry.missing.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-red)", letterSpacing: "0.05em" }}>
          View Full Results →
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuthStore();
  const { setResult } = useResultStore();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch history when user is available
  useEffect(() => {
    if (!user) return;
    setFetching(true);
    supabase
      .from("analysis_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          setEntries((data as HistoryEntry[]) ?? []);
        }
        setFetching(false);
      });
  }, [user]);

  const handleCardClick = (entry: HistoryEntry) => {
    // Restore full result into the store and navigate to /results
    setResult({
      name: entry.job_title,
      resume_skills: entry.resume_skills ?? [],
      jd_skills: entry.jd_skills ?? [],
      match_score: entry.match_score,
      matched: (entry.matched ?? []) as Parameters<typeof setResult>[0]["matched"],
      missing: entry.missing ?? [],
      roadmap: (entry.roadmap ?? []) as Parameters<typeof setResult>[0]["roadmap"],
    });
    router.push("/results");
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Dot grid */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundSize: "20px 20px", backgroundImage: "radial-gradient(var(--dot-color) 1px, transparent 1px)", pointerEvents: "none" }} />
      <div className="pointer-events-none fixed inset-0 bg-[var(--bg-primary)] [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)]" style={{ zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Navbar */}
        <nav style={{ height: "64px", display: "flex", alignItems: "center", padding: "0 32px", borderBottom: "1px solid var(--border)", justifyContent: "space-between" }}>
          <span
            style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "18px", color: "var(--text-cream)", letterSpacing: "-0.03em", cursor: "pointer" }}
            onClick={() => router.push("/")}
          >
            HirePrep <span style={{ color: "var(--accent-red)" }}>AI.</span>
          </span>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <ThemeToggle size={34} />
            <AuthButton />
            <button onClick={() => router.push("/upload")} style={{ fontFamily: "var(--font-mono)", fontSize: "12px", padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
              New Analysis
            </button>
          </div>
        </nav>

        {/* Page content */}
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 32px 80px" }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.15em", color: "var(--accent-red)", textTransform: "uppercase", margin: "0 0 10px" }}>
              Analysis History
            </p>
            <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "clamp(24px,3vw,40px)", color: "var(--text-cream)", letterSpacing: "-0.03em", margin: "0 0 8px" }}>
              Your Past Analyses
            </h1>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              Click any card to restore the full analysis and roadmap.
            </p>
          </motion.div>

          <div style={{ height: "32px" }} />

          {/* ── Not signed in ──────────────────────────────────────────────── */}
          {!loading && !user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "48px 40px",
                textAlign: "center",
                maxWidth: "520px",
                margin: "0 auto",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔐</div>
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "22px", color: "var(--text-cream)", margin: "0 0 12px" }}>
                Sign in to view your history
              </h2>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", margin: "0 0 24px", lineHeight: 1.6 }}>
                Your analysis history is tied to your Google account. Sign in to see all past results — no passwords, no friction.
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", margin: "0 0 20px", padding: "10px 16px", background: "rgba(46,204,113,0.07)", borderRadius: "8px", border: "1px solid rgba(46,204,113,0.15)" }}>
                ✅ You can still analyze without signing in — history is optional.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={signInWithGoogle}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "10px",
                  fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "14px",
                  padding: "12px 28px", borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-primary)", color: "var(--text-cream)",
                  cursor: "pointer",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </motion.button>
            </motion.div>
          )}

          {/* ── Loading ───────────────────────────────────────────────────── */}
          {user && fetching && (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
              <div style={{ width: "36px", height: "36px", border: "3px solid var(--border)", borderTop: "3px solid var(--accent-red)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── Error ─────────────────────────────────────────────────────── */}
          {error && (
            <div style={{ background: "rgba(201,74,58,0.1)", border: "1px solid rgba(201,74,58,0.3)", borderRadius: "10px", padding: "16px 20px", color: "var(--accent-red)", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
              Failed to load history: {error}
            </div>
          )}

          {/* ── Empty state ───────────────────────────────────────────────── */}
          {user && !fetching && !error && entries.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "60px 40px",
                textAlign: "center",
                maxWidth: "520px",
                margin: "0 auto",
              }}
            >
              <div style={{ fontSize: "52px", marginBottom: "16px" }}>📭</div>
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "20px", color: "var(--text-cream)", margin: "0 0 10px" }}>
                No analyses yet
              </h2>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", margin: "0 0 24px" }}>
                Upload your resume and run your first analysis to see results here.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/upload")}
                style={{
                  fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "13px",
                  padding: "10px 24px", borderRadius: "8px",
                  background: "var(--accent-red)", border: "none",
                  color: "#fff", cursor: "pointer",
                }}
              >
                Analyze My Resume →
              </motion.button>
            </motion.div>
          )}

          {/* ── History Cards Grid ────────────────────────────────────────── */}
          {user && !fetching && entries.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}
            >
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <HistoryCard entry={entry} onClick={() => handleCardClick(entry)} />
                </motion.div>
              ))}
            </motion.div>
          )}

        </div>
      </div>
    </main>
  );
}
