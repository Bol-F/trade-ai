"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "trade-ai-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The root layout is rendered with the dark class, so the server output and
  // first client render are deterministic. Browser preference is applied only
  // after hydration.
  const [theme, updateTheme] = useState<Theme>("dark");

  useEffect(() => {
    let cancelled = false;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const preferred: Theme =
      saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    queueMicrotask(() => {
      if (cancelled) return;
      updateTheme(preferred);
      applyTheme(preferred);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    updateTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [setTheme, theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
