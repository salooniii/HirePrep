"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useResultStore, type RoadmapWeek } from "@/store/resultStore";
import ThemeToggle from "@/components/ui/ThemeToggle";

// ── Radial Score Ring ──────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 72;
  const cx = 90;
  const cy = 90;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  const color = score >= 70 ? "#2ecc71" : score >= 45 ? "#e8823a" : "#c94a3a";
  const grade = score >= 70 ? "Strong" : score >= 45 ? "Moderate" : "Weak";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <div style={{ position: "relative" }}>
        <svg width={180} height={180} viewBox="0 0 180 180">
          {/* Background track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
          {/* Glow */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
          />
          {/* Score text */}
          <text x={cx} y={cy - 10} textAnchor="middle" fill="var(--text-cream)"
            style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "36px", letterSpacing: "-0.03em" }}>
            {Math.round(score)}%
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-muted)"
            style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.08em" }}>
            MATCH SCORE
          </text>
        </svg>
      </div>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 16px",
        borderRadius: "999px",
        background: `${color}18`,
        border: `1px solid ${color}44`,
      }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "13px", color }}>
          {grade} Match
        </span>
      </div>
    </div>
  );
}

// ── Vertical Bar Chart ─────────────────────────────────────────────────────────
function VerticalBarChart({ data }: { data: { jd: string; resume: string; score: number }[] }) {
  const bars = data;
  const CHART_H = 200;
  const LABEL_H = 64;
  const YAXIS_W = 36;

  return (
    <div style={{ width: "100%", overflowX: "auto", paddingBottom: "4px" }}>
      <div style={{ display: "flex", minWidth: `${bars.length * 56 + YAXIS_W}px` }}>

        {/* Y-axis */}
        <div style={{
          width: `${YAXIS_W}px`,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingBottom: `${LABEL_H}px`,
          height: `${CHART_H + LABEL_H}px`,
        }}>
          {[100, 75, 50, 25, 0].map((v) => (
            <span key={v} style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-muted)",
              textAlign: "right",
              paddingRight: "8px",
              lineHeight: 1,
            }}>{v}%</span>
          ))}
        </div>

        {/* Bars area */}
        <div style={{ flex: 1, position: "relative" }}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <div key={pct} style={{
              position: "absolute",
              left: 0, right: 0,
              top: `${((100 - pct) / 100) * CHART_H}px`,
              borderTop: pct === 0 ? "1px solid var(--border-hover)" : "1px dashed var(--border)",
            }} />
          ))}

          {/* Bars row */}
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
            height: `${CHART_H}px`,
            padding: "0 4px",
          }}>
            {bars.map((m, i) => {
              const pct = Math.round(m.score * 100);
              const color = pct >= 80 ? "#2ecc71" : pct >= 60 ? "#e8823a" : "#c94a3a";
              const barH = Math.max((pct / 100) * CHART_H, 4);

              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: "100%",
                    cursor: "default",
                  }}
                  title={`${m.jd} ← ${m.resume}: ${pct}%`}
                >
                  {/* Percentage label above bar */}
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 + 0.6 }}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "11px",
                      fontWeight: 700,
                      color,
                      marginBottom: "4px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {pct}%
                  </motion.span>

                  {/* Bar itself */}
                  <div style={{
                    width: "100%",
                    maxWidth: "44px",
                    height: `${CHART_H - 24}px`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    borderRadius: "6px 6px 0 0",
                  }}>
                    <motion.div
                      initial={{ scaleY: 0, originY: 1 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        width: "100%",
                        height: `${(pct / 100) * (CHART_H - 24)}px`,
                        background: `linear-gradient(to top, ${color}55, ${color})`,
                        borderRadius: "5px 5px 0 0",
                        boxShadow: `0 -6px 16px ${color}33`,
                        transformOrigin: "bottom",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Shine overlay */}
                      <div style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0,
                        height: "40%",
                        background: "linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)",
                        borderRadius: "5px 5px 0 0",
                      }} />
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div style={{
            display: "flex",
            gap: "8px",
            padding: "0 4px",
            marginTop: "8px",
            borderTop: "1px solid var(--border)",
            paddingTop: "10px",
            height: `${LABEL_H}px`,
          }}>
            {bars.map((m, i) => (
              <div key={i} style={{
                flex: 1,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
              }}>
                <span style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-cream)",
                  textAlign: "center",
                  lineHeight: 1.3,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical" as any,
                  overflow: "hidden",
                  maxWidth: "52px",
                  wordBreak: "break-word",
                }}>
                  {m.jd}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skill Infographic Bubble ───────────────────────────────────────────────────
type SkillVariant = "matched" | "missing" | "neutral";

function SkillBubble({ label, variant, delay = 0 }: { label: string; variant: SkillVariant; delay?: number }) {
  const [hovered, setHovered] = useState(false);
  const cfg: Record<SkillVariant, { bg: string; border: string; color: string; glow: string }> = {
    matched: {
      bg: "rgba(46,204,113,0.12)",
      border: "rgba(46,204,113,0.35)",
      color: "#2ecc71",
      glow: "rgba(46,204,113,0.3)",
    },
    missing: {
      bg: "rgba(201,74,58,0.12)",
      border: "rgba(201,74,58,0.35)",
      color: "#c94a3a",
      glow: "rgba(201,74,58,0.3)",
    },
    neutral: {
      bg: "rgba(168,152,128,0.10)",
      border: "rgba(168,152,128,0.25)",
      color: "#a89880",
      glow: "rgba(168,152,128,0.2)",
    },
  };
  const c = cfg[variant];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 12px",
        borderRadius: "999px",
        background: hovered ? `${c.border}` : c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        fontSize: "12px",
        whiteSpace: "nowrap",
        cursor: "default",
        transition: "all 0.2s",
        boxShadow: hovered ? `0 0 12px ${c.glow}` : "none",
        letterSpacing: "0.01em",
      }}
    >
      <span style={{
        width: "5px", height: "5px", borderRadius: "50%",
        background: c.color, flexShrink: 0,
        boxShadow: `0 0 4px ${c.color}`,
      }} />
      {label}
    </motion.span>
  );
}

// ── Section Header ──────────────────────────────────────────────────────────────
function SectionLabel({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
      <span style={{ fontSize: "16px" }}>{icon}</span>
      <span style={{
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        fontSize: "14px",
        color: "var(--text-cream)",
        letterSpacing: "0.01em",
      }}>
        {children}
      </span>
    </div>
  );
}

// ── Card wrapper ───────────────────────────────────────────────────────────────
function Card({
  children,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "24px",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Roadmap Week Card ─────────────────────────────────────────────────────────
function RoadmapWeekCard({ week, color }: { week: RoadmapWeek; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: "12px",
      }}
    >
      {/* Goal */}
      <div style={{
        padding: "16px",
        background: `${color}10`,
        borderRadius: "12px",
        border: `1px solid ${color}30`,
      }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, color, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px" }}>
          🎯 Goal
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text-cream)", margin: "0 0 10px", lineHeight: 1.5 }}>
          {week.goal}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {(week.skills ?? []).map((s, i) => (
            <p key={i} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
              · {s}
            </p>
          ))}
        </div>
      </div>

      {/* Resource */}
      <div style={{
        padding: "16px",
        background: "rgba(232,130,58,0.08)",
        borderRadius: "12px",
        border: "1px solid rgba(232,130,58,0.25)",
      }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, color: "#e8823a", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px" }}>
          📚 Resource
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text-cream)", margin: "0 0 10px", lineHeight: 1.5 }}>
          {week.resource}
        </p>
        {week.resourceUrl && (
          <a
            href={week.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--accent-red)",
              textDecoration: "none",
              padding: "4px 10px",
              borderRadius: "6px",
              background: "rgba(201,74,58,0.1)",
              border: "1px solid rgba(201,74,58,0.25)",
            }}
          >
            Open →
          </a>
        )}
      </div>

      {/* Milestone */}
      <div style={{
        padding: "16px",
        background: "rgba(46,204,113,0.06)",
        borderRadius: "12px",
        border: "1px solid rgba(46,204,113,0.2)",
      }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, color: "#2ecc71", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px" }}>
          🏁 Milestone
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text-cream)", margin: 0, lineHeight: 1.5 }}>
          {week.milestone}
        </p>
      </div>

      {/* Outcomes */}
      <div style={{
        padding: "16px",
        background: "rgba(168,152,128,0.06)",
        borderRadius: "12px",
        border: "1px solid var(--border)",
      }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px" }}>
          ✓ Outcomes
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {(week.outcomes ?? []).map((o, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <span style={{ color: "#2ecc71", fontSize: "12px", flexShrink: 0 }}>✓</span>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                {o}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Roadmap Chevron ────────────────────────────────────────────────────────────
function Chevron({
  week, theme, color, active, hovered, index, total,
  onHover, onLeave, onClick,
}: {
  week: string; theme: string; color: string;
  active: boolean; hovered: boolean; index: number; total: number;
  onHover: () => void; onLeave: () => void; onClick: () => void;
}) {
  const isOdd = index % 2 === 0;
  return (
    <motion.div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      animate={{ y: hovered ? (isOdd ? -6 : 6) : 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{
        flex: 1,
        position: "relative",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "60px",
        background: color,
        clipPath: index === 0
          ? "polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%)"
          : "polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 18px 50%)",
        marginLeft: index === 0 ? 0 : "-20px",
        transition: "all 0.2s",
        zIndex: active ? 10 : total - index,
        boxShadow: active ? `0 4px 20px ${color}44` : "none",
      }}
    >
      {/* Dark overlay for inactive state */}
      {!active && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", pointerEvents: "none" }} />
      )}
      <div style={{ textAlign: "center", padding: "0 28px", position: "relative", zIndex: 1 }}>
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "9px",
          fontWeight: 600,
          color: "rgba(255,255,255,0.8)",
          margin: "0 0 3px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}>
          {week}
        </p>
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          fontWeight: 700,
          color: "#fff",
          margin: 0,
          lineHeight: 1.3,
        }}>
          {theme}
        </p>
      </div>
    </motion.div>
  );
}

// ── Stat Badge ─────────────────────────────────────────────────────────────────
function StatBadge({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      padding: "12px 20px",
      background: `${color}10`,
      borderRadius: "12px",
      border: `1px solid ${color}30`,
      minWidth: "80px",
    }}>
      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "22px", color, letterSpacing: "-0.03em" }}>
        {value}
      </span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const router = useRouter();
  const result = useResultStore((s) => s.result);
  const [activeWeek, setActiveWeek] = useState(0);
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  useEffect(() => {
    if (!result) {
      router.replace("/upload");
    }
  }, [result, router]);

  if (!result) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            border: "3px solid var(--accent-red)",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ fontFamily: "var(--font-sans)", color: "var(--text-muted)", fontSize: "14px" }}>
            Loading results…
          </p>
        </div>
      </main>
    );
  }

  const d = result;
  const missingSet = new Set(d.missing);
  const roadmap: RoadmapWeek[] = Array.isArray(d.roadmap) ? d.roadmap : [];
  const activeRoadmap = roadmap[activeWeek] ?? null;
  const matchPct = Math.round(d.match_score);

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "0" }}>
      {/* Dot bg */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundSize: "22px 22px",
        backgroundImage: "radial-gradient(var(--dot-color) 1px, transparent 1px)",
        pointerEvents: "none",
      }} />
      <div
        className="pointer-events-none fixed inset-0 bg-[var(--bg-primary)] [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)]"
        style={{ zIndex: 1 }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* ── Navbar ── */}
        <nav style={{
          height: "60px",
          display: "flex",
          alignItems: "center",
          padding: "0 36px",
          borderBottom: "1px solid var(--border)",
          justifyContent: "space-between",
          background: "var(--nav-bg)",
          backdropFilter: "blur(14px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => router.push("/")}
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 800,
                fontSize: "18px",
                color: "var(--text-cream)",
                letterSpacing: "-0.03em",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              HirePrep <span style={{ color: "var(--accent-red)" }}>AI.</span>
            </button>
            <span style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              color: "var(--text-muted)",
              padding: "3px 10px",
              borderRadius: "999px",
              background: "var(--border)",
              border: "1px solid var(--border)",
            }}>
              Analysis Results
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <ThemeToggle size={34} />
            <button
              onClick={() => router.push("/upload")}
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: "13px",
                padding: "8px 18px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-cream)"; e.currentTarget.style.borderColor = "var(--border-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              + New Analysis
            </button>
          </div>
        </nav>

        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 36px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* ── Row 1: Score + Stats ── */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "20px", alignItems: "stretch" }}>

            {/* Score Panel */}
            <Card delay={0} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 40px", gap: "20px" }}>
              <ScoreRing score={d.match_score} />

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                <StatBadge value={`${d.matched.length}`} label="Matched" color="#2ecc71" />
                <StatBadge value={`${d.missing.length}`} label="Missing" color="#c94a3a" />
                <StatBadge value={`${d.jd_skills.length}`} label="Required" color="#e8823a" />
              </div>

              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "18px", color: "var(--text-cream)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                  {d.name}
                </p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                  Target Role Analysis
                </p>
              </div>
            </Card>

            {/* Right: Skills Infographic */}
            <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: "20px" }}>

              {/* Resume Skills */}
              <Card delay={0.1} style={{ overflowY: "auto", maxHeight: "200px" }}>
                <SectionLabel icon="📄">Your Resume Skills — {d.resume_skills.length}</SectionLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  {d.resume_skills.map((s, i) => (
                    <SkillBubble
                      key={`rs-${i}`}
                      label={s}
                      variant={missingSet.has(s) ? "neutral" : "neutral"}
                      delay={i * 0.015}
                    />
                  ))}
                </div>
              </Card>

              {/* Role Required Skills */}
              <Card delay={0.15} style={{ overflowY: "auto", maxHeight: "200px" }}>
                <SectionLabel icon="🎯">Role Requires — {d.jd_skills.length}</SectionLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  {d.jd_skills.map((s, i) => (
                    <SkillBubble
                      key={`jd-${i}`}
                      label={s}
                      variant={missingSet.has(s) ? "missing" : "matched"}
                      delay={i * 0.015}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* ── Row 2: Skill Analysis (vertical bar chart + missing) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "20px", alignItems: "start" }}>

            {/* Vertical Bar Chart */}
            <Card delay={0.2}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <SectionLabel icon="📊">Skill Match Analysis</SectionLabel>
                <div style={{ display: "flex", gap: "16px" }}>
                  {[
                    { label: "Strong ≥80%", color: "#2ecc71" },
                    { label: "Moderate ≥60%", color: "#e8823a" },
                    { label: "Weak <60%", color: "#c94a3a" },
                  ].map((l) => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: l.color }} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)" }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <VerticalBarChart data={d.matched} />
            </Card>

            {/* Missing Skills */}
            <Card delay={0.25} style={{ minWidth: "220px", maxWidth: "280px" }}>
              <SectionLabel icon="❌">Missing Skills</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {d.missing.map((s, i) => (
                  <motion.div
                    key={`miss-${i}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "rgba(201,74,58,0.08)",
                      border: "1px solid rgba(201,74,58,0.2)",
                    }}
                  >
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c94a3a", flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 500, color: "#c94a3a" }}>
                      {s}
                    </span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Row 3: Roadmap ── */}
          {roadmap.length > 0 && (
            <Card delay={0.3}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <SectionLabel icon="🗺️">Learning Roadmap</SectionLabel>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)" }}>
                  {roadmap.length} weeks
                </span>
              </div>

              {/* Chevron chain */}
              <div style={{ display: "flex", marginBottom: "24px", borderRadius: "8px", overflow: "hidden" }}>
                {roadmap.map((week, i) => (
                  <Chevron
                    key={i}
                    index={i}
                    total={roadmap.length}
                    week={week.week}
                    theme={week.theme}
                    color={week.color || "#c94a3a"}
                    active={activeWeek === i}
                    hovered={hoveredWeek === i}
                    onHover={() => setHoveredWeek(i)}
                    onLeave={() => setHoveredWeek(null)}
                    onClick={() => setActiveWeek(i)}
                  />
                ))}
              </div>

              {/* Active week content */}
              <AnimatePresence mode="wait">
                {activeRoadmap && (
                  <RoadmapWeekCard
                    key={activeWeek}
                    week={activeRoadmap}
                    color={activeRoadmap.color || "#c94a3a"}
                  />
                )}
              </AnimatePresence>
            </Card>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}