"use client";

import DragReveal from "@/components/ui/DragReveal";
import ResumeGeneric from "@/components/resume/ResumeGeneric";
import ResumeOptimized from "@/components/resume/ResumeOptimized";

export default function Features() {
  return (
    <section
      style={{
        backgroundColor: "var(--bg-primary)",
        padding: "100px 48px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            letterSpacing: "0.15em",
            color: "var(--text-muted)",
            marginBottom: "20px",
            textTransform: "uppercase",
          }}
        >
          Before and after
        </p>

        <h2
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 800,
            fontSize: "clamp(28px, 5vw, 68px)",
            color: "var(--text-white)",
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            textAlign: "center",
            marginBottom: "28px",
          }}
        >
          SAME EXPERIENCE.
          <br />
          DIFFERENT OUTCOME.
        </h2>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            color: "var(--text-muted)",
            textAlign: "center",
            lineHeight: 1.8,
            maxWidth: "600px",
            marginBottom: "72px",
          }}
        >
          Your resume probably isn't bad — it's just not aligned yet. Drag to
          see how the same experience performs when tailored to a specific role.
        </p>

        <DragReveal
          left={<ResumeGeneric />}
          right={<ResumeOptimized />}
        />
      </div>
    </section>
  );
}