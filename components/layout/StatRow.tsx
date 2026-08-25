import { cn } from "@/lib/utils";

export function StatRow({
  items,
  className,
}: {
  items: { label: string; value: string | number; hint?: string; tone?: "default" | "primary" | "danger" | "warn" }[];
  className?: string;
}) {
  const cols = items.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : items.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className={cn("grid gap-2 sm:gap-3", cols, className)}>
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border bg-card p-3 sm:p-4">
          <p
            className={cn(
              "stat-label",
              item.tone === "primary" && "text-primary",
              item.tone === "danger" && "text-destructive",
              item.tone === "warn" && "text-amber-400"
            )}
          >
            {item.label}
          </p>
          <p className="mt-1.5 text-sm sm:text-lg font-semibold leading-tight line-clamp-2">{item.value}</p>
          {item.hint && <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">{item.hint}</p>}
        </div>
      ))}
    </div>
  );
}
