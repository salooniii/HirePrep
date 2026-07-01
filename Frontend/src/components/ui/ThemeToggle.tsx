"use client";

import { useThemeStore } from "@/store/themeStore";
import { useEffect, useState } from "react";

/**
 * ThemeToggle — Sun/Moon toggle button.
 * Works in any navbar or page — just drop it in.
 * `variant` controls whether it renders for a light or dark surrounding bg.
 */
export default function ThemeToggle({ size = 36 }: { size?: number }) {
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Avoid SSR hydration mismatch — render only after mount
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div style={{ width: size, height: size }} />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      style={{
        width: size,
        height: size,
        borderRadius: "8px",
        border: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        transition: "all 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent-red)";
        e.currentTarget.style.background = "var(--bg-warm)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.background = "var(--bg-secondary)";
      }}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-cream)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "all 0.2s" }}>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-cream)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "all 0.2s" }}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
