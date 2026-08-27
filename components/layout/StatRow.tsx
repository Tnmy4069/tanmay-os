import { cn } from "@/lib/utils";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Clock3,
  Sparkles,
} from "lucide-react";

export type StatTone = "default" | "primary" | "danger" | "warn" | "info" | "next";

const TONE_STYLE: Record<
  StatTone,
  { shell: string; iconWrap: string; label: string; value: string }
> = {
  default: {
    shell: "bg-secondary/70",
    iconWrap: "bg-card text-muted-foreground",
    label: "text-muted-foreground",
    value: "text-foreground",
  },
  primary: {
    shell: "bg-primary/15 dark:bg-primary/20",
    iconWrap: "bg-primary text-primary-foreground",
    label: "text-[color:var(--primary-deep)] dark:text-primary",
    value: "text-[color:var(--primary-deep)] dark:text-primary",
  },
  danger: {
    shell: "bg-destructive/12 dark:bg-destructive/20",
    iconWrap: "bg-destructive text-destructive-foreground",
    label: "text-destructive",
    value: "text-destructive",
  },
  warn: {
    shell: "bg-[color:var(--streak)]/15 dark:bg-[color:var(--streak)]/20",
    iconWrap: "bg-[color:var(--streak)] text-white",
    label: "text-[color:var(--streak)]",
    value: "text-[color:var(--streak)]",
  },
  info: {
    shell: "bg-[color:var(--info)]/15 dark:bg-[color:var(--info)]/20",
    iconWrap: "bg-[color:var(--info)] text-[color:var(--info-foreground)]",
    label: "text-[color:var(--info)]",
    value: "text-foreground",
  },
  next: {
    shell: "bg-[color:var(--warning)]/20 dark:bg-[color:var(--warning)]/15",
    iconWrap: "bg-[color:var(--warning)] text-[color:var(--warning-foreground)]",
    label: "text-[color:var(--warning-foreground)] dark:text-[color:var(--warning)]",
    value: "text-foreground",
  },
};

function defaultIcon(label: string, tone?: StatTone): LucideIcon {
  const key = label.toLowerCase();
  if (key.includes("pending") || key.includes("task")) return CheckSquare;
  if (key.includes("now") || key.includes("current")) return Sparkles;
  if (key.includes("next")) return ArrowRight;
  if (key.includes("overdue") || tone === "danger") return AlertTriangle;
  return Clock3;
}

export function StatRow({
  items,
  className,
}: {
  items: {
    label: string;
    value: string | number;
    hint?: string;
    tone?: StatTone;
    href?: string;
    icon?: LucideIcon;
  }[];
  className?: string;
}) {
  const cols =
    items.length >= 4
      ? "grid-cols-2 lg:grid-cols-4"
      : items.length === 3
        ? "grid-cols-3"
        : "grid-cols-2";

  return (
    <div className={cn("grid gap-2.5 sm:gap-3", cols, className)}>
      {items.map((item) => {
        const tone = item.tone || "default";
        const styles = TONE_STYLE[tone];
        const Icon = item.icon || defaultIcon(item.label, tone);

        const inner = (
          <>
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10",
                  styles.iconWrap
                )}
              >
                <Icon className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" strokeWidth={2.5} />
              </span>
              {item.href && (
                <span className={cn("mt-1 text-[10px] font-extrabold uppercase tracking-wide opacity-70", styles.label)}>
                  Open
                </span>
              )}
            </div>
            <p className={cn("mt-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] sm:text-[11px]", styles.label)}>
              {item.label}
            </p>
            <p
              className={cn(
                "mt-1 line-clamp-2 text-base font-black leading-tight tracking-tight sm:text-xl",
                styles.value
              )}
            >
              {item.value}
            </p>
            {item.hint && (
              <p className="mt-1 truncate text-[11px] font-bold tabular-nums text-muted-foreground">{item.hint}</p>
            )}
          </>
        );

        const shell = cn(
          "rounded-3xl p-3.5 sm:p-4 transition-[transform,filter] duration-200",
          styles.shell,
          item.href &&
            "block hover:brightness-[0.98] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        );

        return item.href ? (
          <Link key={item.label} href={item.href} className={shell}>
            {inner}
          </Link>
        ) : (
          <div key={item.label} className={shell}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
