"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarRange,
  Database,
  Layers,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LogoutButton } from "@/components/features/LogoutButton";

type TabId = "reminders" | "categories" | "account" | "data";

const TABS: { id: TabId; label: string; icon: typeof Bell }[] = [
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "categories", label: "Spaces", icon: Layers },
  { id: "account", label: "Account", icon: User },
  { id: "data", label: "Data", icon: Database },
];

export function SettingsShell({
  user,
  reminders,
  categories,
}: {
  user: { name?: string | null; email?: string | null } | null;
  reminders: ReactNode;
  categories: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("reminders");

  return (
    <div className="space-y-5">
      <div>
        <p className="type-caption">Settings</p>
        <h1 className="type-h1 mt-1">Make it yours</h1>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          One section at a time — keep it simple.
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-extrabold transition-colors active:scale-95",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "reminders" && (
        <section className="space-y-3">
          <SectionIntro title="Reminders" hint="Nudge this device for quests and due tasks." />
          {reminders}
        </section>
      )}

      {tab === "categories" && (
        <section className="space-y-3">
          <SectionIntro title="Spaces" hint="Rename groups or add subcategories." />
          {categories}
        </section>
      )}

      {tab === "account" && (
        <section className="space-y-3">
          <SectionIntro title="Account" hint="Theme and sign out." />
          {user && (
            <div className="flex items-center gap-3 rounded-3xl bg-primary/10 px-4 py-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground">
                {(user.name ?? user.email ?? "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                {user.name && <p className="truncate text-base font-extrabold">{user.name}</p>}
                <p className="truncate text-xs font-semibold text-muted-foreground">{user.email}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-3xl bg-secondary/80 px-4 py-3.5">
            <div>
              <p className="text-sm font-extrabold">Appearance</p>
              <p className="text-xs font-semibold text-muted-foreground">Light or dark</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-3xl bg-destructive/10 px-4 py-3.5">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-extrabold text-destructive">
                <LogOut className="h-4 w-4" />
                Sign out
              </p>
              <p className="text-xs font-semibold text-muted-foreground">Back to login</p>
            </div>
            <LogoutButton />
          </div>
        </section>
      )}

      {tab === "data" && (
        <section className="space-y-3">
          <SectionIntro title="Data" hint="Routine editor and defaults." />
          <Link
            href="/settings/routine"
            className="flex items-center gap-3 rounded-3xl bg-[color:var(--info)]/15 px-4 py-3.5 transition-transform active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--info)] text-[color:var(--info-foreground)]">
              <CalendarRange className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">Weekly routine</p>
              <p className="text-xs font-semibold text-muted-foreground">Edit today&apos;s time slots</p>
            </div>
            <span className="text-xs font-extrabold text-[color:var(--info)]">Open</span>
          </Link>

          <div className="rounded-3xl bg-secondary/80 px-4 py-3.5">
            <p className="text-sm font-extrabold">Load default routine</p>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
              Seeds a starter weekly schedule if you&apos;re starting fresh.
            </p>
            <a
              href="/api/seed"
              className="mt-3 inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-extrabold text-background active:scale-95"
            >
              Load defaults
            </a>
          </div>
        </section>
      )}
    </div>
  );
}

function SectionIntro({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
      <p className="text-sm font-semibold text-muted-foreground">{hint}</p>
    </div>
  );
}
