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
    <div className="flex flex-col items-center justify-center py-14 text-center gap-2.5 rounded-2xl border border-dashed border-border">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground max-w-sm">{hint}</p>
    </div>
  );
}
