"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import MiniResumeCard from "@/components/resume/MiniResumeCard";

const steps = [
  {
    number: "01",
    title: "Paste a job posting",
    description: "Add any job URL. We extract requirements, keywords, and expectations.",
  },
  {
    number: "02",
    title: "Get an optimized resume",
    description: "We rewrite your resume to match the role. Summary, bullets, and skills all aligned.",
  },
  {
    number: "03",
    title: "Apply with confidence",
    description: "Download your resume and apply. The whole process takes under a minute.",
  },
];

export default function Process() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [played, setPlayed] = useState(false);
  const [resumeOptimized, setResumeOptimized] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !played) {
          setPlayed(true);
          playAnimation();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [played]);

function playAnimation() {
  const track = trackRef.current;
  const resume = resumeRef.current;
  const tick = tickRef.current;
  if (!track || !resume || !tick) return;

  const trackWidth = track.offsetWidth;
  const resumeWidth = 120;
  const endX = trackWidth - resumeWidth;

  // Reset
  gsap.set(resume, { x: 0, opacity: 1 });
  gsap.set(tick, { opacity: 0, scale: 0 });
  stepRefs.current.forEach((el) => {
    if (el) gsap.set(el, { opacity: 0, y: 16 });
  });
  setResumeOptimized(false);

  const stepsTriggered = [false, false, false];
  const forwardDuration = 4.5;
  const backwardDuration = 4.5;

  function checkSteps(currentX: number) {
    const pct = currentX / endX;

    if (!stepsTriggered[0]) {
      stepsTriggered[0] = true;
      gsap.to(stepRefs.current[0], { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
    }
    if (pct >= 0.33 && !stepsTriggered[1]) {
      stepsTriggered[1] = true;
      gsap.to(stepRefs.current[1], { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
    }
    if (pct >= 0.66 && !stepsTriggered[2]) {
      stepsTriggered[2] = true;
      gsap.to(stepRefs.current[2], { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
    }
  }

  function goForward() {
    gsap.to(resume, {
      x: endX,
      duration: forwardDuration,
      ease: "sine.inOut",        // slow start, fast middle, slow end
      onUpdate() {
        checkSteps(gsap.getProperty(resume, "x") as number);
      },
      onComplete() {
        // Swap to optimized resume at the end
        setResumeOptimized(true);
        // Show tick at fixed right end
        gsap.to(tick, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" });
        // Brief pause at end before reversing
        gsap.delayedCall(0.8, goBackward);
      },
    });
  }

  function goBackward() {
    // Hide tick as it leaves
    gsap.to(tick, { opacity: 0, scale: 0.5, duration: 0.3, ease: "power2.in" });
    gsap.to(resume, {
      x: 0,
      duration: backwardDuration,
      ease: "sine.inOut",
      onComplete() {
        // Swap back to generic at the start
        setResumeOptimized(false);
        gsap.delayedCall(0.4, goForward);
      },
    });
  }

  goForward();
}
  return (
    <section
      ref={sectionRef}
      style={{
        background: "var(--bg-primary)",
        padding: "100px 0 80px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 40px",
          marginBottom: "64px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.15em",
            color: "var(--accent-red)",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          HOW IT WORKS
        </p>
        <h2
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 800,
            fontSize: "clamp(32px, 4vw, 52px)",
            color: "var(--text-cream)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          From job post to application
          <br />
          in under a minute.
        </h2>
      </div>

      {/* Steps grid */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 40px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          borderTop: "1px solid var(--border)",
        }}
      >
        {steps.map((step, i) => (
          <div
            key={step.number}
            ref={(el) => { stepRefs.current[i] = el; }}
            style={{
              padding: "32px 32px 32px 0",
              borderRight: i < 2 ? "1px solid var(--border)" : "none",
              paddingLeft: i > 0 ? "32px" : "0",
              opacity: 0,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "16px",
                letterSpacing: "0.1em",
              }}
            >
              {step.number}
            </p>
            <h3
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: "16px",
                color: "var(--text-cream)",
                marginBottom: "10px",
              }}
            >
              {step.title}
            </h3>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                color: "var(--text-muted)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Track + animated resume */}
      <div
  style={{
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 40px",
    position: "relative",
    height: "160px",
    marginTop: "8px",
  }}
>
  {/* Track line */}
  <div
    ref={trackRef}
    style={{
      position: "absolute",
      top: "50%",
      left: "40px",
      right: "40px",
      height: "1px",
      background: "var(--border)",
      transform: "translateY(-50%)",
    }}
  />

  {/* Fixed green tick at the right end of the track */}
  <div
    ref={tickRef}
    style={{
      position: "absolute",
      top: "50%",
      right: "40px",
      transform: "translateY(-50%)",
      opacity: 0,
    }}
  >
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="#2ecc71" opacity="0.15" />
      <circle cx="20" cy="20" r="18" stroke="#2ecc71" strokeWidth="1.5" />
      <polyline
        points="12,20 18,26 28,14"
        stroke="#2ecc71"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>

  {/* Animated resume card */}
  <div
    ref={resumeRef}
    style={{
      position: "absolute",
      top: "50%",
      left: "40px",
      transform: "translateY(-50%)",
      width: "120px",
      height: "120px",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      opacity: 0,
    }}
  >
    <MiniResumeCard optimized={resumeOptimized} />

          {/* Green tick overlay */}
          <div
            ref={tickRef}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(26,61,42,0.85)",
              borderRadius: "8px",
              opacity: 0,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" fill="#2ecc71" opacity="0.15" />
              <circle cx="20" cy="20" r="18" stroke="#2ecc71" strokeWidth="1.5" />
              <polyline
                points="12,20 18,26 28,14"
                stroke="#2ecc71"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom taglines */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "32px auto 0",
          padding: "0 40px",
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid var(--border)",
          paddingTop: "24px",
        }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>
          No templates. No manual editing.
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>
          Tailored to every job, every time.
        </p>
      </div>
    </section>
  );
}