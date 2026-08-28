"use client";

import { Clock, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, theme, toggle } = useTheme();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggle}
      className={cn("relative transition-transform active:scale-90", className)}
      aria-label={`Theme: ${mode} (active: ${theme})`}
      title={`Theme: ${mode === "auto" ? `Auto Time-based (${theme})` : mode} — Click to switch`}
    >
      {mode === "auto" ? (
        <span className="relative flex items-center justify-center">
          {theme === "dark" ? <Moon className="h-4 w-4 text-purple-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
          <span className="absolute -bottom-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        </span>
      ) : theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
