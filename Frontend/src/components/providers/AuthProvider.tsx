"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

/**
 * AuthProvider
 * Mounts once in layout.tsx and:
 *  1. Restores the existing session from localStorage on page load
 *  2. Subscribes to auth state changes (sign-in / sign-out)
 * No UI — purely a session synchronizer.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return <>{children}</>;
}
