"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Digit boxes — `length` is how many slots to show (4–10). */
export function PinDigits({
  length,
  value,
  error,
  success,
  maxHint,
}: {
  length: number;
  value: string;
  error?: boolean;
  success?: boolean;
  /** When true, show up to 10 slots so user can type longer PINs during create */
  maxHint?: number;
}) {
  const boxes = Math.min(Math.max(maxHint ?? length, length, 4), 10);

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-1.5 sm:gap-2"
      animate={error ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
      transition={error ? { duration: 0.45 } : undefined}
    >
      {Array.from({ length: boxes }).map((_, i) => {
        const filled = i < value.length;
        const active = i === value.length;
        const beyondMin = i >= 4 && !filled && i >= Math.max(value.length, 4);
        return (
          <motion.div
            key={i}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{
              scale: filled ? 1.04 : 1,
              opacity: beyondMin && value.length < 4 ? 0.35 : 1,
              borderColor: success
                ? "var(--primary)"
                : error
                  ? "var(--destructive)"
                  : active
                    ? "var(--primary)"
                    : "var(--border)",
            }}
            transition={{ type: "spring", stiffness: 420, damping: 28, delay: i * 0.015 }}
            className={cn(
              "flex h-11 w-8 items-center justify-center rounded-xl border-2 bg-card sm:h-12 sm:w-9 sm:rounded-2xl",
              filled && "bg-secondary"
            )}
          >
            {filled ? (
              <motion.span
                key={`${i}-${value[i]}`}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  error ? "bg-destructive" : success ? "bg-primary" : "bg-foreground"
                )}
              />
            ) : (
              <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-primary/50" : "bg-border")} />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
