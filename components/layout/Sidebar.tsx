"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Brain,
  CalendarDays,
  CheckSquare,
  Briefcase,
  Code2,
  Calculator,
  GraduationCap,
  TrendingUp,
  Box,
  ShieldAlert,
  Dumbbell,
  Heart,
  BarChart3,
  Settings,
  LayoutDashboard,
  CalendarCheck2,
  CalendarRange,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Today", href: "/today", icon: CalendarDays },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Career", divider: true },
  { name: "Job Hunt", href: "/career/jobs", icon: Briefcase },
  { name: "DSA", href: "/career/dsa", icon: Code2 },
  { name: "Aptitude", href: "/career/aptitude", icon: Calculator },
  { name: "Education", divider: true },
  { name: "IIT Madras", href: "/education/iitm", icon: GraduationCap },
  { name: "Upskilling", href: "/education/upskilling", icon: TrendingUp },
  { name: "Leadership", divider: true },
  { name: "Apthex", href: "/leadership/apthex", icon: Box },
  { name: "CyberX", href: "/leadership/cyberx", icon: ShieldAlert },
  { name: "Personal", divider: true },
  { name: "Fitness", href: "/personal/fitness", icon: Dumbbell },
  { name: "Personal Life", href: "/personal/life", icon: Heart },
  { name: "Checklist", href: "/personal/checklist", icon: CalendarCheck2 },
  { name: "System", divider: true },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Routine", href: "/settings/routine", icon: CalendarRange },
  { name: "Settings", href: "/settings", icon: Settings },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5 px-2">
      {navigation.map((item, index) => {
        if (item.divider) {
          return (
            <div key={`div-${index}`} className="pt-5 pb-1.5">
              <p className="px-3 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.16em]">
                {item.name}
              </p>
            </div>
          );
        }

        const isActive = pathname === item.href;
        const Icon = item.icon!;

        return (
          <Link
            key={item.name}
            href={item.href!}
            onClick={onNavigate}
            className={cn(
              "group flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(45,212,191,0.25)]"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <Icon className={cn("mr-3 h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "opacity-70")} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/5 bg-background/80 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight">Tanmay OS</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl p-2 hover:bg-white/5"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setOpen(false)}>
          <aside
            className="absolute left-0 top-0 h-full w-72 bg-card border-r border-white/5 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between border-b border-white/5 px-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <span className="font-semibold">Tanmay OS</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl p-2 hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(100%-3.5rem)] overflow-y-auto py-3">
              <Nav onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden lg:flex h-full w-[260px] flex-col border-r border-white/5 bg-card/70 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/5 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold tracking-tight leading-none">Tanmay OS</p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Personal system</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <Nav />
        </div>
      </aside>
    </>
  );
}
