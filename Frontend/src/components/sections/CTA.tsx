"use client";

import { motion } from "motion/react";
import { Spotlight } from "@/components/ui/spotlight";
import { CometCard } from "@/components/ui/comet-card";
import MiniResumeCard from "@/components/resume/MiniResumeCard";
import { useEffect,useRef } from "react";

export default function CTA() {
  const sectionRef = useRef<HTMLElement>(null);

useEffect(() => {
  const section = sectionRef.current;
  if (!section) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        section.classList.add("in-view");
        observer.disconnect();
      }
    },
    { threshold: 0.2 }
  );

  observer.observe(section);
  return () => observer.disconnect();
}, []);
  return (
    <section
      ref={sectionRef}
      style={{
        background: "var(--bg-primary)",
        position: "relative",
        overflow: "hidden",
        padding: "120px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "520px",
      }}
    >
      {/* Spotlight — comes from top-left */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="var(--accent-red)"
      />

      {/* Inner layout */}
      <div
        style={{
          maxWidth: "1200px",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
          gap: "80px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Left — CTA copy */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.15em",
              color: "var(--accent-red)",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            ANALYSE YOUR RESUME
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "clamp(32px, 4vw, 56px)",
              color: "var(--text-cream)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              margin: "0 0 20px",
            }}
          >
            Stop sending resumes
            <br />
            that get torn apart.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              color: "var(--text-muted)",
              lineHeight: 1.7,
              margin: "0 0 40px",
            }}
          >
            Upload your PDF resume and paste a job description.
            <br />
            Get your ATS score and a week-by-week learning roadmap.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ display: "flex", gap: "16px", alignItems: "center" }}
          >
            <button
              onClick={() => { if (typeof window !== 'undefined') window.location.href = '/upload'; }}
              style={{
                background: "var(--accent-red)",
                color: "var(--text-white)",
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: "15px",
                padding: "14px 32px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              Analyse my Resume →
            </button>

          </motion.div>
        </div>

        {/* Right — CometCard with big resume */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ display: "flex", justifyContent: "center" }}
        >
          <CometCard
            rotateDepth={12}
            translateDepth={16}
            className="w-full max-w-[340px]"
          >
            <div
              style={{
                width: "340px",
                height: "440px",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
              }}
            >
              <MiniResumeCard
                optimized={true}
                name="Priya Sharma"
                role="Frontend Engineer"
                score={81}
              />
            </div>
          </CometCard>
        </motion.div>
      </div>
    </section>
  );
}