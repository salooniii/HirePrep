"use client";

import { useState } from "react";
import { faqs } from "@/data/faq";
import { FAQItem } from "@/types/faq";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section
      id="faq"
      style={{
        backgroundColor: "var(--bg-primary)",
        padding: "100px 48px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Label */}
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            letterSpacing: "0.15em",
            color: "var(--text-muted)",
            marginBottom: "24px",
            textTransform: "uppercase",
          }}
        >
          FAQ
        </p>

        {/* Heading */}
        <h2
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 52px)",
            color: "var(--text-white)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "16px",
            maxWidth: "600px",
          }}
        >
          Before you apply — and before you interview
        </h2>

        {/* Subtext */}
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--text-muted)",
            marginBottom: "56px",
          }}
        >
          Most users download and apply within minutes
        </p>

        {/* FAQ Items */}
        <div>
          {faqs.map((faq: FAQItem, i: number) => (
            <FAQRow
              key={i}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQRow({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 0",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "15px",
            fontWeight: isOpen ? 700 : 400,
            color: isOpen ? "var(--text-white)" : "var(--text-muted)",
            transition: "color 0.2s",
          }}
        >
          {faq.question}
        </span>

        {/* Chevron */}
        <span
          style={{
            color: "var(--text-muted)",
            fontSize: "18px",
            transition: "transform 0.3s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            display: "inline-block",
            flexShrink: 0,
            marginLeft: "24px",
          }}
        >
          ⌄
        </span>
      </button>

      {/* Answer */}
      <div
        style={{
          maxHeight: isOpen ? "300px" : "0",
          overflow: "hidden",
          transition: "max-height 0.35s ease",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--text-muted)",
            lineHeight: 1.9,
            paddingBottom: "28px",
            maxWidth: "720px",
          }}
        >
          {faq.answer}
        </p>
      </div>
    </div>
  );
}