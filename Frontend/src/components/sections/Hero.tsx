"use client";

import { useRef, useState } from "react";
import CardStack from "@/components/ui/CardStack";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import MiniResumeCard from "@/components/resume/MiniResumeCard";
import { FileUpload } from "@/components/ui/file-upload";
import { useUploadStore } from "@/store/uploadStore";
import { useRouter } from "next/navigation";

const stackCards = [
  <MiniResumeCard key={1} optimized={false} name="Aryan Mehta" role="Product Designer" score={42} />,
  <MiniResumeCard key={2} optimized={true} name="Aryan Mehta" role="Product Designer" score={73} />,
  <MiniResumeCard key={3} optimized={false} name="Priya Sharma" role="Frontend Engineer" score={38} />,
  <MiniResumeCard key={4} optimized={true} name="Priya Sharma" role="Frontend Engineer" score={81} />,
  <MiniResumeCard key={5} optimized={false} name="Rohan Das" role="Data Analyst" score={45} />,
];

export default function Hero() {
  const { file, setFile } = useUploadStore();
  const router = useRouter();

  const handleSubmit = () => {
    router.push("/upload");
  };

  return (
    <section
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--accent-red)",
        padding: "0 48px",
        paddingTop: "56px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          alignItems: "center",
        }}
      >
        {/* Left: Copy + Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Headline */}
          <div>
            <h1
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 800,
                fontSize: "clamp(36px, 5vw, 64px)",
                lineHeight: 1.05,
                color: "#1a0a04",
                letterSpacing: "-0.03em",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.3em",
              }}
            >
              BEAT
              <ContainerTextFlip
                words={["ATS", "REJECTIONS", "SCREENING", "COMPETITION", "MEDIOCRITY"]}
                interval={2500}
                animationDuration={600}
                textClassName="text-white"
                className="!text-[clamp(32px,2.5vw,64px)] !font-extrabold !leading-none !tracking-[-0.03em] !pt-1 !pb-2"
              />
            </h1>
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: "clamp(18px, 2.5vw, 28px)",
                color: "#1a0a04",
                marginTop: "12px",
                lineHeight: 1.3,
              }}
            >
              Stop sending the same resume.
              <br />
              Start getting interview invites.
            </h2>
          </div>

          {/* Upload Card */}
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            {/* Card Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "rgba(0,0,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                  }}
                >
                  ↑
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "var(--text-cream)",
                  }}
                >
                  Upload resume
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-cream)",
                  letterSpacing: "0.05em",
                }}
              >
                PDF only
              </span>
            </div>

            {/* Drop Zone */}
            <div style={{ marginBottom: "14px" }}>
              <FileUpload
                value={file}
                onChange={(files) => {
                  if (files[0]) {
                    setFile(files[0]);
                  }
                }}
              />
            </div>



            {/* CTA Button */}
            <button
              onClick={handleSubmit}
              style={{
                width: "100%",
                padding: "14px",
                background: "var(--text-cream)",
                border: "none",
                borderRadius: "8px",
                color: "var(--bg-primary)",
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.85";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Analyse my resume →
            </button>
          </div>
        </div>

        {/* Right: Card Stack */}
        <div
          style={{
            height: "580px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CardStack cards={stackCards} />
        </div>
      </div>
    </section>
  );
}