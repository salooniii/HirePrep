export default function ResumeOptimized() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f5f0e8",
        padding: "40px 48px",
        overflowY: "auto",
        fontFamily: "var(--font-mono)",
        position: "relative",
      }}
    >
      {/* Match Score Badge */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "var(--success-dark)",
          border: "1px solid var(--success)",
          borderRadius: "8px",
          padding: "8px 14px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 800,
            fontSize: "22px",
            color: "var(--success)",
            lineHeight: 1,
          }}
        >
          73% <span style={{ fontSize: "13px" }}>↑31%</span>
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--success)",
            opacity: 0.7,
            letterSpacing: "0.08em",
          }}
        >
          MATCH SCORE
        </span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#1a0a04",
            margin: 0,
            fontFamily: "var(--font-sans)",
          }}
        >
          Aryan Mehta
        </h1>
        <p style={{ fontSize: "13px", color: "#7a6a58", marginTop: "4px" }}>
          aryan.mehta@email.com · linkedin.com/in/aryanmehta · Mumbai, India
        </p>
      </div>

      <Divider />

      {/* Summary — rewritten */}
      <Section title="Summary">
        <p style={{ fontSize: "12px", color: "#4a3a28", lineHeight: 1.8 }}>
          Product designer with 3+ years shipping{" "}
          <Highlight>data-driven UX</Highlight> for fintech products at scale.
          Specialised in <Highlight>0→1 product design</Highlight>,{" "}
          <Highlight>design systems</Highlight>, and cross-functional
          collaboration with engineering and PM to reduce time-to-ship by{" "}
          <Highlight>40%</Highlight>.
        </p>
      </Section>

      {/* Experience */}
      <Section title="Experience">
        <Job
          title="Product Designer"
          company="Groww · Mumbai"
          date="2022 — Present"
          bullets={[
            <>
              Led <Highlight>cross-functional redesign</Highlight> of investment
              dashboard — lifted engagement by 28%
            </>,
            <>
              Built scalable <Highlight>design system</Highlight> adopted by 6
              teams, cut ship time by 35%
            </>,
            <>
              Owned <Highlight>data-heavy UX</Highlight> for reporting surfaces;
              partnered with data science
            </>,
            <>
              Ran <Highlight>usability testing</Highlight> and{" "}
              <Highlight>A/B experiments</Highlight> across 3 core flows
            </>,
          ]}
        />
        <Job
          title="UI Designer"
          company="Razorpay · Bangalore"
          date="2021 — 2022"
          bullets={[
            <>
              Redesigned <Highlight>SEO & analytics</Highlight> tooling for
              merchant dashboard
            </>,
            <>
              Maintained and extended{" "}
              <Highlight>component library</Highlight> across 4 product squads
            </>,
            <>
              Shipped onboarding flow backed by{" "}
              <Highlight>A/B testing</Highlight> and cohort analysis
            </>,
          ]}
        />
      </Section>

      {/* Skills — chips */}
      <Section title="Core Skills">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[
            { label: "Design Systems", hot: true },
            { label: "Product Metrics", hot: true },
            { label: "Data-heavy UX", hot: true },
            { label: "A/B Testing", hot: true },
            { label: "Figma", hot: false },
            { label: "Prototyping", hot: false },
            { label: "User Research", hot: false },
            { label: "HTML / CSS", hot: false },
          ].map((skill) => (
            <span
              key={skill.label}
              style={{
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                background: skill.hot
                  ? "rgba(201,74,58,0.12)"
                  : "rgba(0,0,0,0.06)",
                border: skill.hot
                  ? "1px solid var(--accent-red)"
                  : "1px solid #d4c8b8",
                color: skill.hot ? "var(--accent-red)" : "#4a3a28",
                fontWeight: skill.hot ? 700 : 400,
              }}
            >
              {skill.label}
            </span>
          ))}
        </div>
      </Section>

      {/* Education */}
      <Section title="Education">
        <p
          style={{
            fontSize: "12px",
            color: "#4a3a28",
            fontWeight: 600,
            margin: 0,
          }}
        >
          B.Des — National Institute of Design, Ahmedabad
        </p>
        <p style={{ fontSize: "11px", color: "#9a8a78", marginTop: "2px" }}>
          2017 — 2021
        </p>
      </Section>

      {/* Missing keywords notice */}
      <div
        style={{
          marginTop: "8px",
          padding: "10px 14px",
          background: "rgba(201,74,58,0.06)",
          border: "1px solid rgba(201,74,58,0.2)",
          borderRadius: "6px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--accent-red)",
            letterSpacing: "0.08em",
            marginBottom: "6px",
          }}
        >
          ADDED FOR THIS ROLE
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["Product Metrics", "Data-heavy UX", "SEO Workflows"].map((k) => (
            <span
              key={k}
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                color: "var(--accent-red)",
                background: "rgba(201,74,58,0.1)",
                padding: "2px 8px",
                borderRadius: "3px",
                border: "1px solid rgba(201,74,58,0.3)",
              }}
            >
              • {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: "rgba(201,74,58,0.12)",
        color: "var(--accent-red)",
        padding: "1px 4px",
        borderRadius: "3px",
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

function Divider() {
  return (
    <div
      style={{
        borderTop: "1px solid #d4c8b8",
        marginBottom: "20px",
      }}
    />
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <p
        style={{
          fontSize: "10px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#9a8a78",
          marginBottom: "10px",
          fontFamily: "var(--font-mono)",
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function Job({
  title,
  company,
  date,
  bullets,
}: {
  title: string;
  company: string;
  date: string;
  bullets: React.ReactNode[];
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#1a0a04",
            margin: 0,
            fontFamily: "var(--font-sans)",
          }}
        >
          {title}
        </p>
        <p style={{ fontSize: "11px", color: "#9a8a78", margin: 0 }}>{date}</p>
      </div>
      <p style={{ fontSize: "11px", color: "#7a6a58", marginBottom: "8px" }}>
        {company}
      </p>
      <ul style={{ margin: 0, paddingLeft: "16px" }}>
        {bullets.map((b, i) => (
          <li
            key={i}
            style={{ fontSize: "12px", color: "#4a3a28", lineHeight: 1.8 }}
          >
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}