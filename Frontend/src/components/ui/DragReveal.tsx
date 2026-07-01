"use client";

import { useRef, useState, useCallback } from "react";

interface DragRevealProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialPercent?: number;
}

export default function DragReveal({
  left,
  right,
  initialPercent = 50,
}: DragRevealProps) {
  const [percent, setPercent] = useState(initialPercent);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const calcPercent = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const p = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setPercent(p);
  }, []);

  const onMouseDown = () => setIsDragging(true);
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) calcPercent(e.clientX);
  };
  const onTouchMove = (e: React.TouchEvent) =>
    calcPercent(e.touches[0].clientX);

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchEnd={onMouseUp}
      style={{
        position: "relative",
        width: "100%",
        height: "680px",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid var(--border)",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
    >
      {/* Right panel — full width, sits behind */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        {right}
      </div>

      {/* Left panel — clipped to percent */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          clipPath: `inset(0 ${100 - percent}% 0 0)`,
          transition: isDragging ? "none" : "clip-path 0.1s ease",
          overflow: "hidden",
        }}
      >
        {left}
      </div>

      {/* Divider line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${percent}%`,
          width: "2px",
          background:
            "linear-gradient(to bottom, transparent, var(--accent-red), transparent)",
          zIndex: 10,
          transform: "translateX(-50%)",
          pointerEvents: "none",
        }}
      />

      {/* Handle */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={() => setIsDragging(true)}
        style={{
          position: "absolute",
          top: "50%",
          left: `${percent}%`,
          transform: "translate(-50%, -50%)",
          zIndex: 20,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "var(--text-white)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          fontSize: "14px",
          color: "#1a0a04",
          fontWeight: 700,
          transition: isDragging ? "none" : "left 0.1s ease",
        }}
      >
        ◀▶
      </div>

      {/* Panel labels */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          zIndex: 15,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          padding: "4px 12px",
          borderRadius: "4px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          pointerEvents: "none",
        }}
      >
        Generic
      </div>
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 15,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          padding: "4px 12px",
          borderRadius: "4px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          letterSpacing: "0.1em",
          color: "var(--success)",
          textTransform: "uppercase",
          pointerEvents: "none",
        }}
      >
        Optimized ✓
      </div>
    </div>
  );
}