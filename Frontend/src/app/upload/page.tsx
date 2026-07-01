"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { FileUpload } from "@/components/ui/file-upload";
import { useUploadStore, type InputMode } from "@/store/uploadStore";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import AuthButton from "@/components/ui/AuthButton";

const TABS: { id: InputMode; label: string; icon: string }[] = [
  { id: "title", label: "Job Title", icon: "✦" },
  { id: "jd",    label: "Job Description", icon: "≡" },
];

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    file, setFile,
    inputMode, setInputMode,
    jobTitle, setJobTitle,
    jdText, setJdText,
  } = useUploadStore();

  const hasJobInput = inputMode === "title"
    ? jobTitle.trim().length > 0
    : jdText.trim().length > 0;

  const canSubmit = !!(file && hasJobInput);

  const handleSubmit = () => {
    if (!canSubmit) return;
    router.push("/analyze");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
      }}
    >
      {/* Dot background */}
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundSize: "20px 20px",
          backgroundImage: "radial-gradient(var(--dot-color) 1px, transparent 1px)",
        }}
      />
      {/* Fade vignette */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)] [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)]"
        style={{ zIndex: 1 }}
      />

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        {/* Top-right controls */}
        <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10, display: "flex", gap: "10px", alignItems: "center" }}>
          <AuthButton />
          <ThemeToggle size={34} />
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: "48px", cursor: "pointer" }}
          onClick={() => router.push("/")}
        >
          <span style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 800,
            fontSize: "20px",
            color: "var(--text-cream)",
            letterSpacing: "-0.03em",
          }}>
            HirePrep <span style={{ color: "var(--accent-red)" }}>AI.</span>
          </span>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            width: "100%",
            maxWidth: "580px",
            background: "var(--bg-secondary)",
            borderRadius: "16px",
            padding: "36px",
            border: "1px solid var(--border)",
          }}
        >
          {/* Card Header */}
          <div style={{ marginBottom: "28px" }}>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.15em",
              color: "var(--accent-red)",
              textTransform: "uppercase",
              margin: "0 0 10px",
            }}>
              Step 1 of 2
            </p>
            <h1 style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "28px",
              color: "var(--text-cream)",
              letterSpacing: "-0.02em",
              margin: "0 0 8px",
            }}>
              Upload your resume
            </h1>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--text-muted)",
              margin: 0,
            }}>
              Analyse your skills and get a personalised learning roadmap.
            </p>

            {/* Auth history badge */}
            <div style={{ marginTop: "14px" }}>
              {user ? (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "6px 12px", borderRadius: "6px",
                  background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)",
                  fontFamily: "var(--font-mono)", fontSize: "11px", color: "#2ecc71",
                }}>
                  💾 Signed in — analysis will be saved to your history
                </div>
              ) : (
                <button
                  onClick={() => useAuthStore.getState().signInWithGoogle()}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "6px 12px", borderRadius: "6px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                    fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "var(--text-cream)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  🔒 Sign in with Google to save history (optional)
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "var(--border)", marginBottom: "28px" }} />

          {/* File Upload — PDF only */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "14px", color: "var(--text-cream)" }}>
                Resume
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                PDF only
              </span>
            </div>
            <FileUpload
              value={file}
              onChange={(files) => { if (files[0]) setFile(files[0]); }}
              accept="application/pdf"
            />
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "var(--border)", marginBottom: "24px" }} />

          {/* Tab Switcher */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "10px",
              padding: "4px",
              border: "1px solid var(--border)",
              marginBottom: "20px",
              position: "relative",
            }}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInputMode(tab.id)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "7px",
                    border: "none",
                    background: inputMode === tab.id ? "var(--accent-red)" : "transparent",
                    color: inputMode === tab.id ? "#fff" : "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: inputMode === tab.id ? 700 : 400,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    letterSpacing: "0.02em",
                  }}
                >
                  <span style={{ fontSize: "10px" }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Animated input area */}
            <AnimatePresence mode="wait">
              {inputMode === "title" ? (
                <motion.div
                  key="title"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <span style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "var(--text-cream)",
                    display: "block",
                    marginBottom: "10px",
                  }}>
                    Target Job Title
                  </span>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${jobTitle.trim() ? "var(--accent-red)" : "var(--border)"}`,
                    borderRadius: "8px",
                    padding: "0 16px",
                    transition: "border-color 0.2s",
                  }}>
                    <span style={{ fontSize: "14px", opacity: 0.4, color: "var(--text-cream)" }}>✦</span>
                    <input
                      type="text"
                      placeholder="e.g. Full Stack Developer, Data Scientist..."
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      style={{
                        flex: 1,
                        height: "48px",
                        background: "transparent",
                        border: "none",
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        color: "var(--text-cream)",
                        outline: "none",
                      }}
                    />
                  </div>
                  <p style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    margin: "8px 0 0",
                  }}>
                    Our DistilBERT model will predict the required skills for this role.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="jd"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <span style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "var(--text-cream)",
                    display: "block",
                    marginBottom: "10px",
                  }}>
                    Job Description
                  </span>
                  <textarea
                    placeholder="Paste the full job description here..."
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    rows={6}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${jdText.trim() ? "var(--accent-red)" : "var(--border)"}`,
                      borderRadius: "8px",
                      padding: "14px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      color: "var(--text-cream)",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s",
                    }}
                  />
                  <p style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    margin: "8px 0 0",
                  }}>
                    Skills will be extracted directly from the pasted text using NLP.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "var(--border)", margin: "8px 0 24px" }} />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: "100%",
              padding: "14px",
              background: canSubmit ? "var(--accent-red)" : "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: "8px",
              color: canSubmit ? "#fff" : "var(--text-muted)",
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "15px",
              cursor: canSubmit ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => {
              if (canSubmit) e.currentTarget.style.background = "var(--accent-brown)";
            }}
            onMouseLeave={(e) => {
              if (canSubmit) e.currentTarget.style.background = "var(--accent-red)";
            }}
          >
            {!file
              ? "Upload a resume to continue"
              : !hasJobInput
              ? `Enter a ${inputMode === "title" ? "job title" : "job description"} to continue`
              : "Analyse my resume →"}
          </button>

          {/* Privacy note */}
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-muted)",
            textAlign: "center",
            margin: "16px 0 0",
          }}>
            🔒 Private. Not stored. Not shared.
          </p>
        </motion.div>

        {/* Step indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ display: "flex", gap: "8px", marginTop: "32px" }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: i === 0 ? "24px" : "8px",
                height: "8px",
                borderRadius: "4px",
                background: i === 0 ? "var(--accent-red)" : "rgba(255,255,255,0.15)",
                transition: "all 0.3s",
              }}
            />
          ))}
        </motion.div>
      </div>
    </main>
  );
}