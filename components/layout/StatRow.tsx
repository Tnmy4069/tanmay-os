import { cn } from "@/lib/utils";
import Link from "next/link";

export function StatRow({
  items,
  className,
}: {
  items: {
    label: string;
    value: string | number;
    hint?: string;
    tone?: "default" | "primary" | "danger" | "warn";
    href?: string;
  }[];
  className?: string;
}) {
  const cols = items.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : items.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className={cn("grid gap-2.5 sm:gap-3", cols, className)}>
      {items.map((item) => {
        const inner = (
          <>
            <p
              className={cn(
                "stat-label",
                item.tone === "primary" && "text-[color:var(--primary-deep)] dark:text-primary",
                item.tone === "danger" && "text-destructive",
                item.tone === "warn" && "text-[color:var(--streak)]"
              )}
            >
              {item.label}
            </p>
            <p className="mt-1.5 line-clamp-2 text-sm font-extrabold leading-tight sm:text-lg">{item.value}</p>
            {item.hint && <p className="mt-1 text-[11px] font-bold tabular-nums text-muted-foreground">{item.hint}</p>}
          </>
        );

        const shell = cn(
          "rounded-2xl border-2 border-border bg-card p-3 shadow-[var(--shadow-sm)] sm:p-4",
          item.href &&
            "block transition-[border-color,transform,background-color] hover:border-primary/40 hover:bg-secondary/40 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
