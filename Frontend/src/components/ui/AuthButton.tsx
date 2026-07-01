"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

interface AuthButtonProps {
  scrolled?: boolean;
}

export default function AuthButton({ scrolled = true }: AuthButtonProps) {
  const { user, signInWithGoogle, signOut, loading } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!mounted || loading) return null;

  // ── Signed Out ─────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={signInWithGoogle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          fontWeight: 600,
          padding: "7px 16px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          color: "var(--text-cream)",
          cursor: "pointer",
          letterSpacing: "0.02em",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
        }}
      >
        {/* Google G SVG */}
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </motion.button>
    );
  }

  // ── Signed In ──────────────────────────────────────────────────────────────
  const name = user.user_metadata?.full_name?.split(" ")[0] || "You";
  const avatar = user.user_metadata?.avatar_url;

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          fontWeight: 600,
          padding: "5px 12px 5px 6px",
          borderRadius: "999px",
          border: "1px solid rgba(46,204,113,0.3)",
          background: "rgba(46,204,113,0.08)",
          color: "var(--text-cream)",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {/* Avatar */}
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            width={24}
            height={24}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            background: "var(--accent-red)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 700, color: "#fff",
          }}>
            {name[0].toUpperCase()}
          </div>
        )}
        <span style={{ color: "#2ecc71" }}>●</span>
        {name}
        <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>▾</span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: "180px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
              zIndex: 200,
            }}
          >
            {/* User info header */}
            <div style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
            }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 700, color: "var(--text-cream)", margin: 0 }}>
                {user.user_metadata?.full_name || name}
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
                {user.email}
              </p>
            </div>

            {/* Actions */}
            {[
              { icon: "📋", label: "My History", action: () => { setOpen(false); router.push("/history"); } },
              { icon: "🔴", label: "Sign Out", action: () => { setOpen(false); signOut(); }, red: true },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "11px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  color: item.red ? "var(--accent-red)" : "var(--text-cream)",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
