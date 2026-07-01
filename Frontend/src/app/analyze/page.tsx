"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useUploadStore } from "@/store/uploadStore";
import { useResultStore } from "@/store/resultStore";
import { useAuthStore } from "@/store/authStore";

// ── Step definitions (must match backend PIPELINE_STEPS order) ─────────────
const STEPS = [
  {
    label: "STEP 01 – PARSING",
    description: "Reading your resume.\nParsing layout, sections and raw text from your PDF.",
  },
  {
    label: "STEP 02 – EXTRACTION",
    description: "Identifying your skills.\nMapping keywords from your resume to known skill taxonomy.",
  },
  {
    label: "STEP 03 – MATCHING",
    description: "Comparing against the role.\nScoring relevance, gaps and keyword alignment.",
  },
  {
    label: "STEP 04 – ATS SCORE",
    description: "Calculating your ATS score.\nWeighted semantic similarity against role requirements.",
  },
  {
    label: "STEP 05 – ROADMAP",
    description: "Building your learning plan.\nGenerating a personalised week-by-week roadmap.",
  },
];

const TOTAL_STEPS = STEPS.length;
const RADIUS = 280;
const CENTER = 360;

// 5 stop positions equally spaced around the clock (72° apart starting at 12 o'clock = 270°)
const STOP_ANGLES = [270, 342, 54, 126, 198]; // 270, 270+72, 270+144, 270+216, 270+288

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToXY(startAngle, r, cx, cy);
  const end = polarToXY(endAngle, r, cx, cy);
  const diff = ((endAngle - startAngle) % 360 + 360) % 360;
  const largeArc = diff > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

// Easing function
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export default function AnalyzePage() {
  const router = useRouter();
  const { file, inputMode, jobTitle, jdText } = useUploadStore();
  const setResult = useResultStore((s) => s.setResult);
  const { user } = useAuthStore();

  // currentStep: 0 = waiting, 1-5 = step completed, 6 = done
  const [currentStep, setCurrentStep] = useState(0);
  const [dotAngle, setDotAngle] = useState(270);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const stepStartAngleRef = useRef(270);
  // Queue of target step numbers to animate to
  const pendingStepsRef = useRef<number[]>([]);
  const isAnimatingRef = useRef(false);

  // ── Animate dot from current angle to a target step angle ────────────────
  const animateToStep = (targetStep: number, onDone: () => void) => {
    const startAngle = stepStartAngleRef.current;
    // Continuous angles: each step adds 72° (360°/5)
    const targetAngle = 270 + targetStep * 72;
    const duration = 1200; // ms per step transition
    const startTime = performance.now();

    function tick(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = easeInOut(t);
      const angle = startAngle + (targetAngle - startAngle) * eased;
      setDotAngle(angle);
      setCurrentStep(targetStep);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        stepStartAngleRef.current = targetAngle;
        isAnimatingRef.current = false;
        onDone();
      }
    }
    isAnimatingRef.current = true;
    animFrameRef.current = requestAnimationFrame(tick);
  };

  // Drain the queue of pending step animations
  const drainQueue = () => {
    if (isAnimatingRef.current) return;
    if (pendingStepsRef.current.length === 0) return;
    const next = pendingStepsRef.current.shift()!;
    animateToStep(next, drainQueue);
  };

  const enqueueStep = (step: number) => {
    pendingStepsRef.current.push(step);
    drainQueue();
  };

  // ── Fire the real API call on mount ──────────────────────────────────────
  useEffect(() => {
    // Guard: must have a file and at least one job input
    const hasJobInput = inputMode === "title" ? !!jobTitle.trim() : !!jdText.trim();
    if (!file || !hasJobInput) {
      router.replace("/upload");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const formData = new FormData();
    formData.append("resume_pdf", file);
    // Send the correct field depending on input mode
    if (inputMode === "title") {
      formData.append("job_title", jobTitle);
    } else {
      formData.append("jd_text", jdText);
    }
    formData.append("stream", "true");
    // Append user_id for history saving (empty string = guest, backend ignores it)
    formData.append("user_id", user?.id ?? "");

    let isMounted = true;

    const run = async () => {
      try {
        const res = await fetch(`${apiUrl}/analyze`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Server responded with ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break;

            const event = JSON.parse(payload);

            if (event.type === "step" && isMounted) {
              enqueueStep(event.step);
            }

            if (event.type === "result" && isMounted) {
              setResult(event);
              // Wait for the final animation to finish before navigating
              const waitForAnim = () => {
                if (isAnimatingRef.current || pendingStepsRef.current.length > 0) {
                  setTimeout(waitForAnim, 100);
                } else {
                  setCompleted(true);
                  setTimeout(() => router.push("/results"), 700);
                }
              };
              waitForAnim();
            }

            if (event.type === "error" && isMounted) {
              setErrorMsg(event.message ?? "An unknown error occurred.");
            }
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
        }
      }
    };

    run();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived display values ────────────────────────────────────────────────
  const arcEnd = dotAngle;
  const arcPath = describeArc(CENTER, CENTER, RADIUS, 270, arcEnd);
  const dot = polarToXY(dotAngle, RADIUS, CENTER, CENTER);

  const stopDots = STOP_ANGLES.map((angle, i) => ({
    ...polarToXY(angle, RADIUS, CENTER, CENTER),
    filled: i < currentStep,
    active: i === currentStep - 1,
  }));

  const step = STEPS[Math.max(0, Math.min(currentStep - 1, STEPS.length - 1))];

  // ── Error state ───────────────────────────────────────────────────────────
  if (errorMsg) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--accent-red)", textAlign: "center", maxWidth: "480px" }}>
          ⚠️ Analysis failed: {errorMsg}
        </p>
        <button
          onClick={() => router.push("/upload")}
          style={{
            padding: "12px 24px",
            background: "var(--accent-red)",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← Try Again
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Dot background */}
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:20px_20px]",
          "[background-image:radial-gradient(#2a2a2a_1px,transparent_1px)]",
        )}
        style={{ zIndex: 0 }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[var(--bg-primary)] [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)]"
        style={{ zIndex: 1 }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        <svg
          width={CENTER * 2}
          height={CENTER * 2}
          viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
        >
          {/* Base circle */}
          <circle
            cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
          />

          {/* Filled arc */}
          {currentStep > 0 && (
            <path
              d={arcPath}
              fill="none"
              stroke="var(--accent-orange)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* Stop dots at 5 positions */}
          {stopDots.map((sd, i) => (
            <circle
              key={i}
              cx={sd.x} cy={sd.y}
              r={sd.active ? 9 : 5}
              fill={sd.filled || sd.active ? "var(--accent-red)" : "rgba(255,255,255,0.2)"}
              style={{ transition: "all 0.4s" }}
            />
          ))}

          {/* Moving dot */}
          <circle cx={dot.x} cy={dot.y} r={7} fill="var(--accent-orange)" />
          {/* Glow */}
          <circle cx={dot.x} cy={dot.y} r={14} fill="var(--accent-orange)" opacity={0.2} />

          {/* Center text */}
          <foreignObject x={CENTER - 200} y={CENTER - 80} width={400} height={160}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                height: "100%",
                gap: "12px",
              }}
            >
              {currentStep === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  Connecting to server…
                </motion.p>
              ) : (
                <>
                  <motion.p
                    key={step.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 800,
                      fontSize: "22px",
                      color: "var(--accent-red)",
                      letterSpacing: "-0.02em",
                      margin: 0,
                    }}
                  >
                    {step.label}
                  </motion.p>
                  <motion.p
                    key={step.description}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      lineHeight: 1.7,
                      margin: 0,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {step.description}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.3)",
                      margin: 0,
                    }}
                  >
                    {currentStep} / {TOTAL_STEPS}
                  </motion.p>
                </>
              )}
            </div>
          </foreignObject>
        </svg>
      </div>
    </main>
  );
}