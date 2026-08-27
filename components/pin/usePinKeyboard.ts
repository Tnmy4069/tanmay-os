"use client";

import { useEffect } from "react";

/** Capture physical keyboard digits even when keypad buttons steal focus. */
export function usePinKeyboard(opts: {
  enabled?: boolean;
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onEnter?: () => void;
}) {
  const { enabled = true, onDigit, onBackspace, onEnter } = opts;

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
          // Still handle if it's our dedicated pin input
          if (!target.dataset?.pinInput) return;
        }
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        onBackspace();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onEnter?.();
        return;
      }
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        onDigit(e.key);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onDigit, onBackspace, onEnter]);
}
