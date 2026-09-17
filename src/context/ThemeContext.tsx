"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent) => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  const applyThemeClass = (t: Theme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  };

  useEffect(() => {
    // 1. Read stored preference or system preference
    try {
      const stored = localStorage.getItem("applyloop_theme") as Theme | null;
      if (stored === "dark" || stored === "light") {
        setThemeState(stored);
        applyThemeClass(stored);
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme = prefersDark ? "dark" : "light";
        setThemeState(initialTheme);
        applyThemeClass(initialTheme);
      }
    } catch (e) {
      applyThemeClass("light");
    }
    setMounted(true);
  }, []);

  const toggleTheme = (event?: React.MouseEvent) => {
    const isCurrentlyDark = document.documentElement.classList.contains("dark") || theme === "dark";
    const next: Theme = isCurrentlyDark ? "light" : "dark";

    // If View Transitions API is supported by the browser, use a circular clip-path wave from button
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? 0;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // Save click coordinate to CSS variables for smooth ripple expansion
      document.documentElement.style.setProperty("--theme-x", `${x}px`);
      document.documentElement.style.setProperty("--theme-y", `${y}px`);
      document.documentElement.style.setProperty("--theme-r", `${endRadius}px`);

      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        setThemeState(next);
        try {
          localStorage.setItem("applyloop_theme", next);
        } catch (e) {}
        applyThemeClass(next);
      });
    } else {
      setThemeState(next);
      try {
        localStorage.setItem("applyloop_theme", next);
      } catch (e) {}
      applyThemeClass(next);
    }
  };

  const setTheme = (next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem("applyloop_theme", next);
    } catch (e) {}
    applyThemeClass(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
