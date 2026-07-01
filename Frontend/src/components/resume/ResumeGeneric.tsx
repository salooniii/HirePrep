export default function ResumeGeneric() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f5f0e8",
        padding: "40px 48px",
        overflowY: "auto",
        fontFamily: "var(--font-mono)",
      }}
    >
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

      {/* Summary */}
      <Section title="Summary">
        <p style={{ fontSize: "12px", color: "#4a3a28", lineHeight: 1.8 }}>
          Product designer with 3 years of experience working on mobile and web
          applications. I have worked on various projects involving user
          research, wireframing, and visual design. I enjoy solving problems and
          working with teams.
        </p>
      </Section>

      {/* Experience */}
      <Section title="Experience">
        <Job
          title="Product Designer"
          company="Groww · Mumbai"
          date="2022 — Present"
          bullets={[
            "Worked on the investment dashboard redesign",
            "Created wireframes and prototypes for new features",
            "Collaborated with engineers to ship mobile app updates",
            "Conducted user interviews and usability tests",
          ]}
        />
        <Job
          title="UI Designer"
          company="Razorpay · Bangalore"
          date="2021 — 2022"
          bullets={[
            "Designed screens for the payments dashboard",
            "Maintained the design system",
            "Made high-fidelity mockups for stakeholder reviews",
          ]}
        />
      </Section>

      {/* Skills */}
      <Section title="Skills">
        <p style={{ fontSize: "12px", color: "#4a3a28", lineHeight: 2 }}>
          Figma, Sketch, Adobe XD, Prototyping, User Research, Wireframing,
          Visual Design, HTML, CSS
        </p>
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
    </div>
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
  bullets: string[];
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