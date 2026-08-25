import Link from "next/link";
import { spaceIcon } from "@/lib/space-icons";
import { PageHeader } from "@/components/layout/PageHeader";
import type { SpaceCore } from "@/lib/spaces";
import type { LucideIcon } from "lucide-react";

export function CoreOverviewPage({
  core,
  coreIcon: CoreIcon,
}: {
  core: SpaceCore;
  coreIcon: LucideIcon;
}) {
  const visibleItems = core.items
    .filter((i) => !i.hidden)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="app-page max-w-3xl">
      <PageHeader
        title={core.name}
        icon={CoreIcon}
        description={`${core.name} spaces — select an area to dive in.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleItems.map((item) => {
          const Icon = spaceIcon(item.icon);
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 duration-200 hover:border-primary/30 hover:bg-secondary/50 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.href}</p>
              </div>
              <div className="ml-auto text-muted-foreground/40 transition-colors group-hover:text-primary/60">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
