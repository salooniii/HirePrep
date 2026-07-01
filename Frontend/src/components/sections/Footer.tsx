"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "var(--bg-primary)",
        borderTop: "1px solid var(--border)",
        padding: "60px 48px 40px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "48px",
            marginBottom: "64px",
          }}
        >
          {/* Brand col */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "18px",
                color: "var(--text-white)",
                marginBottom: "12px",
              }}
            >
              HirePrep AI.
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-muted)",
                lineHeight: 1.8,
                maxWidth: "280px",
              }}
            >
              Beat ATS. Get shortlisted. We tailor your resume to every role so
              you stop getting ignored and start getting interviews.
            </p>
          </div>

          {/* Product col */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "20px",
              }}
            >
              Product
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {["How it works", "Pricing", "FAQ", "Changelog"].map((item) => (
                <Link
                  key={item}
                  href="#"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--text-white)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Company col */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "20px",
              }}
            >
              Company
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <Link
                  key={item}
                  href="#"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--text-white)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal col */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "20px",
              }}
            >
              Legal
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                (item) => (
                  <Link
                    key={item}
                    href="#"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--text-white)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    {item}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            © {new Date().getFullYear()} HirePrep AI. All rights reserved.
          </p>

          {/* Social links */}
          <div style={{ display: "flex", gap: "24px" }}>
            {["Twitter", "LinkedIn", "GitHub"].map((s) => (
              <Link
                key={s}
                href="#"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text-white)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

