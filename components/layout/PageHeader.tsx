import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-primary/25 bg-primary/15 text-[color:var(--primary-deep)] dark:text-primary shadow-[var(--shadow-sm)]">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <h1 className="type-h1 truncate">{title}</h1>
        </div>
        {description && <p className="text-sm font-semibold text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
    </div>
  );
}
