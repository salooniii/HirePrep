"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthButton from "@/components/ui/AuthButton";

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinkStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    fontSize: "14px",
    color: "var(--text-cream)",
    textDecoration: "none",
    opacity: 0.75,
    letterSpacing: "0.01em",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 0",
    transition: "opacity 0.2s",
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 48px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "background 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease",
        background: scrolled ? "var(--nav-bg)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
      }}
    >
      {/* ── Logo ── */}
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 700,
          fontSize: "18px",
          color: "var(--text-cream)",
          textDecoration: "none",
          letterSpacing: "-0.02em",
          flexShrink: 0,
        }}
      >
        HirePrep AI.
      </Link>

      {/* ── Right Actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        {/* Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginRight: "12px" }}>
          <button
            onClick={() => router.push("/how-it-works")}
            style={navLinkStyle}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
          >
            How it works
          </button>

          <button
            onClick={() => router.push("/performance")}
            style={navLinkStyle}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
          >
            Performance
          </button>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle size={34} />

        {/* Auth (Sign in / User avatar dropdown) */}
        <AuthButton scrolled={scrolled} />

        {/* CTA */}
        <button
          onClick={() => router.push("/analyze")}
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: "13px",
            padding: "8px 20px",
            background: "var(--accent-red)",
            border: "2px solid var(--accent-red)",
            color: "#fff",
            cursor: "pointer",
            borderRadius: "8px",
            letterSpacing: "0.02em",
            transition: "opacity 0.2s, transform 0.15s",
            whiteSpace: "nowrap",
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
          Get Started
        </button>
      </div>
    </nav>
  );
}