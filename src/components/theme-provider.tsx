"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({
  theme: "light",
  setTheme: () => {},
});

// Gelap mulai 18:00 sampai 06:00 waktu lokal perangkat.
function themeByClock(date: Date = new Date()): Theme {
  const hour = date.getHours();
  return hour >= 18 || hour < 6 ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    function sync() {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const next: Theme = saved === "dark" || saved === "light" ? saved : themeByClock();
      document.documentElement.classList.toggle("dark", next === "dark");
      setTheme(next);
    }
    sync();
    const id = window.setInterval(sync, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

export function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeContext);
  const dark = theme === "dark";

  function toggle() {
    const next: Theme = dark ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Mode gelap"
      onClick={toggle}
      className="inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-slate-200 bg-slate-100 px-1 transition-colors"
    >
      <span
        className={`flex size-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
          dark ? "translate-x-6" : ""
        }`}
      >
        {dark ? <Moon className="size-3.5 text-slate-900" aria-hidden /> : <Sun className="size-3.5 text-slate-900" aria-hidden />}
      </span>
    </button>
  );
}
