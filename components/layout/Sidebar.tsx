"use client";

import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";
import { mobileTabs, systemNavBottom, systemNavTop } from "@/lib/navigation";
import { spaceIcon } from "@/lib/space-icons";
import type { SpaceCore } from "@/lib/spaces";

function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-2xl border-2 border-border bg-card shadow-[var(--shadow-sm)]"
      style={{ width: size, height: size }}
    >
      <Image src="/logo.png" alt="Tanmay OS" fill className="object-cover" sizes={`${size}px`} priority />
    </div>
  );
}

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
        "group flex min-h-11 items-center rounded-2xl px-3 py-2 text-sm font-extrabold duration-200 ease-out",
        isActive
          ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className={cn("mr-3 h-4 w-4 flex-shrink-0", isActive ? "opacity-100" : "opacity-70")} />
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
        "group flex min-h-11 items-center rounded-2xl px-3 py-2 text-sm font-extrabold duration-200 ease-out",
        isActive
          ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className={cn("mr-3 h-4 w-4 flex-shrink-0", isActive ? "opacity-100" : "opacity-70")} />
      {name}
    </Link>
  );
}

function Nav({ cores, onNavigate }: { cores: SpaceCore[]; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1 px-2">
      {systemNavTop.map((item) => (
        <NavLinkItem key={item.href} {...item} onNavigate={onNavigate} />
      ))}

      <div className="pb-1.5 pt-5">
        <p className="px-3 type-caption">Spaces</p>
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

      <div className="pb-1.5 pt-5">
        <p className="px-3 type-caption">System</p>
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
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <aside
            className="absolute inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[1.75rem] border-t-2 border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-lg)]"
            role="dialog"
            aria-modal="true"
            aria-label="More"
          >
            <div className="flex justify-center pt-3">
              <div className="h-1.5 w-12 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2 pt-1">
              <div className="flex items-center gap-2">
                <BrandMark size={36} />
                <span className="font-extrabold tracking-tight">Tanmay OS</span>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="rounded-2xl border-2 border-border p-2.5 hover:bg-secondary"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto px-1 pb-4" style={{ maxHeight: "calc(88dvh - 4.5rem)" }}>
              <Nav cores={cores} onNavigate={() => setMoreOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <nav
        className="mobile-tabbar lg:hidden fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <div className="mx-2 mb-2 grid grid-cols-5 gap-0.5 rounded-[1.75rem] border-2 border-border bg-card px-1 py-1.5 shadow-[var(--shadow-md)]">
          {mobileTabs.map((tab) => {
            const active = isTabActive(pathname, tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-extrabold duration-200 active:scale-95",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-12 items-center justify-center rounded-2xl transition-colors",
                    active && "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.75 : 2.25} />
                </span>
                <span className={cn(active ? "text-primary" : "opacity-80")}>{tab.name}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-extrabold duration-200 active:scale-95",
              !tabActive || moreOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-12 items-center justify-center rounded-2xl",
                (!tabActive || moreOpen) && "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
              )}
            >
              <Menu className="h-5 w-5" strokeWidth={2.5} />
            </span>
            More
          </button>
        </div>
      </nav>

      <aside className="hidden h-full w-[260px] flex-col border-r-2 border-border bg-card/90 lg:flex">
        <div className="flex h-16 items-center justify-between gap-2 border-b-2 border-border px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandMark size={40} />
            <div className="min-w-0">
              <p className="truncate font-extrabold tracking-tight leading-none">Tanmay OS</p>
              <p className="mt-1 type-caption truncate">Level up daily</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <Nav cores={cores} />
        </div>
      </aside>
    </>
  );
}
