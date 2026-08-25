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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-2 sm:pb-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          )}
          <h1 className="text-xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl sm:pl-[52px]">{description}</p>
        )}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
    </div>
  );
}
