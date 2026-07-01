import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "dark",
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        set({ theme: next });
      },
      setTheme: (t) => {
        document.documentElement.setAttribute("data-theme", t);
        set({ theme: t });
      },
    }),
    {
      name: "hireprep-theme",            // localStorage key
      onRehydrateStorage: () => (state) => {
        // Apply stored theme to <html> immediately on page load
        if (state?.theme) {
          document.documentElement.setAttribute("data-theme", state.theme);
        }
      },
    }
  )
);
