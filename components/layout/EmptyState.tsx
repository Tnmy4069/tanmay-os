import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-3xl border-2 border-dashed border-border bg-secondary/40 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl border-2 border-border bg-card text-muted-foreground shadow-[var(--shadow-sm)]">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-base font-extrabold">{title}</p>
      <p className="max-w-sm text-sm font-semibold text-muted-foreground">{hint}</p>
    </div>
  );
}
