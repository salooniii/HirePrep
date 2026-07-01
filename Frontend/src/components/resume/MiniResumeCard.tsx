interface MiniResumeCardProps {
  optimized?: boolean;
  role?: string;
  name?: string;
  score?: number;
}

export default function MiniResumeCard({
  optimized = false,
  role = "Product Designer",
  name = "Aryan Mehta",
  score = 73,
}: MiniResumeCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: optimized ? "#f5f0e8" : "#e8e4de",
        padding: "24px",
        fontFamily: "var(--font-mono)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Score badge — optimized only */}
      {optimized && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "var(--success-dark)",
            border: "1px solid var(--success)",
            borderRadius: "6px",
            padding: "4px 8px",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--success)",
          }}
        >
          {score}% ↑
        </div>
      )}

      {/* Header */}
      <p
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#1a0a04",
          marginBottom: "2px",
          fontFamily: "var(--font-sans)",
        }}
      >
        {name}
      </p>
      <p
        style={{
          fontSize: "10px",
          color: optimized ? "var(--accent-red)" : "#9a8a78",
          marginBottom: "16px",
        }}
      >
        {role}
      </p>

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid #d4c8b8",
          marginBottom: "14px",
        }}
      />

      {/* Fake text lines */}
      <Lines optimized={optimized} />
    </div>
  );
}

function Lines({ optimized }: { optimized: boolean }) {
  const lines = [
    { w: "90%", highlight: false },
    { w: "75%", highlight: optimized },
    { w: "85%", highlight: false },
    { w: "60%", highlight: optimized },
    { w: "80%", highlight: false },
    { w: "70%", highlight: optimized },
    { w: "55%", highlight: false },
    { w: "78%", highlight: false },
    { w: "65%", highlight: optimized },
    { w: "88%", highlight: false },
    { w: "50%", highlight: false },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Section label */}
      <div
        style={{
          fontSize: "8px",
          letterSpacing: "0.15em",
          color: "#9a8a78",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}
      >
        Experience
      </div>
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            height: "6px",
            width: line.w,
            borderRadius: "3px",
            background: line.highlight
              ? "rgba(201,74,58,0.25)"
              : "rgba(0,0,0,0.08)",
            border: line.highlight
              ? "1px solid rgba(201,74,58,0.4)"
              : "none",
          }}
        />
      ))}

      {/* Skills chips */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          marginTop: "8px",
        }}
      >
        {(optimized
          ? ["Design Systems", "Data UX", "A/B Testing"]
          : ["Figma", "Wireframing", "Prototyping"]
        ).map((s) => (
          <span
            key={s}
            style={{
              fontSize: "8px",
              padding: "2px 6px",
              borderRadius: "3px",
              background: optimized
                ? "rgba(201,74,58,0.1)"
                : "rgba(0,0,0,0.06)",
              border: optimized
                ? "1px solid rgba(201,74,58,0.3)"
                : "1px solid #d4c8b8",
              color: optimized ? "var(--accent-red)" : "#7a6a58",
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}