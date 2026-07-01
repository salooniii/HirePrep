"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * /auth/callback
 * Supabase redirects here after Google OAuth completes.
 * Exchanges the code for a session, then sends user back to the upload page.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Signed in successfully — go to upload
        router.replace("/upload");
      } else {
        // Something went wrong — back to home
        router.replace("/");
      }
    });
  }, [router]);

  return (
    <main style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "16px",
    }}>
      <div style={{
        width: "40px", height: "40px",
        border: "3px solid var(--border)",
        borderTop: "3px solid var(--accent-red)",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        color: "var(--text-muted)",
      }}>
        Signing you in…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
