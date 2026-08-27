import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  tone = "primary",
  className,
  label,
}: {
  value: number;
  max?: number;
  tone?: "primary" | "xp" | "streak" | "info" | "warning";
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0));
  const fill =
    tone === "xp"
      ? "bg-[color:var(--xp)]"
      : tone === "streak"
        ? "bg-[color:var(--streak)]"
        : tone === "info"
          ? "bg-[color:var(--info)]"
          : tone === "warning"
            ? "bg-[color:var(--warning)]"
            : "bg-primary";

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <span className="type-caption">{label}</span>
          <span className="text-xs font-extrabold tabular-nums text-muted-foreground">{pct}%</span>
        </div>
      )}
      <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn("progress-fill", fill)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
