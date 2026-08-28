"use client";

import { createContext, useCallback, useContext, useEffect, useState, useTransition } from "react";

export type ThemeMode = "light" | "dark" | "auto" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeContextType = {
  mode: ThemeMode;
  theme: ResolvedTheme; // Current resolved active theme ("light" | "dark")
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  isTimeBased: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: "auto",
  theme: "light",
  setMode: () => undefined,
  toggle: () => undefined,
  isTimeBased: true,
});

/**
 * Determines whether time-based theme should be dark or light.
 * Day: 06:00 AM (06:00) to 06:30 PM (18:30) -> Light
 * Night: 06:30 PM (18:30) to 06:00 AM (06:00) -> Dark
 */
export function getTimeBasedTheme(): ResolvedTheme {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  const sunriseMinutes = 6 * 60; // 06:00 AM
  const sunsetMinutes = 18 * 60 + 30; // 06:30 PM (18:30)

  if (currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes) {
    return "light";
  }
  return "dark";
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  if (mode === "system") return getSystemTheme();
  return getTimeBasedTheme();
}

const STORAGE_KEY = "tanmay-os-theme-mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("auto");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [, startTransition] = useTransition();

  const applyTheme = useCallback((targetTheme: ResolvedTheme) => {
    setResolvedTheme(targetTheme);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", targetTheme === "dark");
    }
  }, []);

  // Initialize theme mode from storage on mount
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initialMode: ThemeMode =
      stored === "dark" || stored === "light" || stored === "auto" || stored === "system"
        ? stored
        : "auto";

    setModeState(initialMode);
    const initialResolved = resolveTheme(initialMode);
    applyTheme(initialResolved);
  }, [applyTheme]);

  // Periodic interval & event listeners for Auto (time-based) and System modes
  useEffect(() => {
    const checkAndApply = () => {
      const currentResolved = resolveTheme(mode);
      applyTheme(currentResolved);
    };

    // Check immediately
    checkAndApply();

    // Check every 30 seconds for auto time-based transition
    const interval = setInterval(checkAndApply, 30000);

    // Listen to tab visibility
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndApply();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Listen to system prefers-color-scheme changes if mode is "system"
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (mode === "system") checkAndApply();
    };
    mediaQuery.addEventListener("change", onSystemChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      mediaQuery.removeEventListener("change", onSystemChange);
    };
  }, [mode, applyTheme]);

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      setModeState(nextMode);
      window.localStorage.setItem(STORAGE_KEY, nextMode);
      const nextResolved = resolveTheme(nextMode);
      applyTheme(nextResolved);
    },
    [applyTheme]
  );

  const toggle = useCallback(() => {
    // Cycle: light -> dark -> auto -> light
    startTransition(() => {
      if (mode === "light") setMode("dark");
      else if (mode === "dark") setMode("auto");
      else setMode("light");
    });
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme: resolvedTheme,
        setMode,
        toggle,
        isTimeBased: mode === "auto",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
