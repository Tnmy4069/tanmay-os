"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Brain, Menu, X } from "lucide-react";
import { ServerClock } from "@/components/layout/ServerClock";
import { cn } from "@/lib/utils";
import { mobileTabs, systemNavBottom, systemNavTop } from "@/lib/navigation";
import { spaceIcon } from "@/lib/space-icons";
import type { SpaceCore } from "@/lib/spaces";

function NavLinkItem({
  href,
  name,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex min-h-10 items-center rounded-full px-3 py-2 text-sm font-medium duration-200 ease-out active:scale-[0.98]",
        isActive ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className={cn("mr-3 h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "opacity-70")} />
      {name}
    </Link>
  );
}

function CoreNavItem({
  href,
  name,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex min-h-10 items-center rounded-full px-3 py-2 text-sm font-medium duration-200 ease-out active:scale-[0.98]",
        isActive ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className={cn("mr-3 h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "opacity-70")} />
      {name}
    </Link>
  );
}


function Nav({ cores, onNavigate }: { cores: SpaceCore[]; onNavigate?: () => void }) {
  return (
    <nav className="space-y-0.5 px-2">
      {systemNavTop.map((item) => (
        <NavLinkItem key={item.href} {...item} onNavigate={onNavigate} />
      ))}

      <div className="pt-5 pb-1.5">
        <p className="px-3 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.16em]">
          Spaces
        </p>
      </div>
      {cores
        .filter((core) => !core.hidden)
        .sort((a, b) => a.order - b.order)
        .map((core) => {
          const Icon = spaceIcon(core.icon);
          return (
            <CoreNavItem
              key={core.id}
              href={`/${core.slug}`}
              name={core.name}
              icon={Icon}
              onNavigate={onNavigate}
            />
          );
        })}

      <div className="pt-5 pb-1.5">
        <p className="px-3 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.16em]">
          System
        </p>
      </div>
      {systemNavBottom.map((item) => (
        <NavLinkItem key={item.href} {...item} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}


function isTabActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ cores }: { cores: SpaceCore[] }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const tabActive = mobileTabs.some((t) => isTabActive(pathname, t.href));

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = moreOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  return (
    <>
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <aside
            className="absolute inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
            role="dialog"
            aria-modal="true"
            aria-label="More"
          >
            <div className="flex justify-center pt-3">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2 pt-1">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <span className="font-semibold tracking-tight">Tanmay OS</span>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-full p-2.5 hover:bg-secondary"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-1 pb-4" style={{ maxHeight: "calc(88dvh - 4.5rem)" }}>
              <Nav cores={cores} onNavigate={() => setMoreOpen(false)} />
              <div className="pt-2">
                <ServerClock />
              </div>
            </div>
          </aside>
        </div>
      )}

      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
        aria-label="Primary"
      >
        <div className="grid grid-cols-5">
          {mobileTabs.map((tab) => {
            const active = isTabActive(pathname, tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className={cn("flex h-7 w-11 items-center justify-center rounded-full", active && "bg-primary/12")}>
                  <Icon className="h-5 w-5" />
                </span>
                {tab.name}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium duration-200",
              !tabActive || moreOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span className={cn("flex h-7 w-11 items-center justify-center rounded-full", (!tabActive || moreOpen) && "bg-primary/12")}>
              <Menu className="h-5 w-5" />
            </span>
            More
          </button>
        </div>
      </nav>

      <aside className="hidden lg:flex h-full w-[248px] flex-col border-r border-border bg-card/80">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/12">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold tracking-tight leading-none">Tanmay OS</p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Personal system</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <Nav cores={cores} />
        </div>
        <ServerClock />
      </aside>
    </>
  );
}