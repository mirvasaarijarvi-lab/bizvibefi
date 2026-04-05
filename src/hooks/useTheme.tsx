import { useState, useEffect } from "react";

type Theme = "light" | "dark";

const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("bizvibe-theme") as Theme | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("bizvibe-theme", theme);
  }, [theme]);

  const toggleTheme = () => setThemeState((prev) => (prev === "light" ? "dark" : "light"));

  return { theme, toggleTheme };
};

export default useTheme;
