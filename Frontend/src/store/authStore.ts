"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthStore {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  loading: true,

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error("[Auth] Google sign-in error:", error.message);
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("[Auth] Sign-out error:", error.message);
    set({ user: null, session: null });
  },

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      loading: false,
    });
  },
}));
