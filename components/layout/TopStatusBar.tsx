"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckSquare, CalendarDays, Flame, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseTimeToMinutes } from "@/utils/date";

export type TopBarSlot = {
  title: string;
  startTime: string;
  endTime: string;
  type: string;
};

export type TopBarProps = {
  pendingCount: number;
  streakDays: number;
  slots: TopBarSlot[];
};

function minutesNowIST() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  return hour * 60 + minute;
}

function findCurrent(slots: TopBarSlot[], mins: number) {
  for (const s of slots) {
    const start = parseTimeToMinutes(s.startTime);
    let end = parseTimeToMinutes(s.endTime);
    if (end <= start) end += 24 * 60;
    if (mins >= start && mins < end) return s;
  }
  return null;
}

function Chip({
  href,
  icon: Icon,
  label,
  value,
  tone = "default",
  wide,
}: {
  href: string;
  icon: typeof Flame;
  label: string;
  value: string;
  tone?: "default" | "primary" | "streak" | "warn";
  wide?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 active:scale-95",
        wide ? "min-w-0 flex-[1.35]" : "flex-1"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9",
          tone === "primary" && "bg-primary text-primary-foreground",
          tone === "streak" && "bg-[color:var(--streak)]/15 text-[color:var(--streak)]",
          tone === "warn" && "bg-primary/15 text-[color:var(--primary-deep)] dark:text-primary",
          tone === "default" && "bg-secondary text-foreground"
        )}
      >
        <Icon className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" strokeWidth={2.5} />
      </span>
      <span className="w-full truncate text-center text-[11px] font-extrabold leading-tight sm:text-xs">
        {value}
      </span>
      <span className="w-full truncate text-center text-[9px] font-bold uppercase tracking-wide text-muted-foreground leading-none">
        {label}
      </span>
    </Link>
  );
}

/** Sticky top status strip — pending, streak, slots, current, settings. */
export function TopStatusBar({ pendingCount, streakDays, slots }: TopBarProps) {
  const [mins, setMins] = useState(minutesNowIST);

  useEffect(() => {
    const id = window.setInterval(() => setMins(minutesNowIST()), 30_000);
    const onVis = () => {
      if (document.visibilityState === "visible") setMins(minutesNowIST());
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const current = useMemo(() => findCurrent(slots, mins), [slots, mins]);
  const slotsLabel = slots.length === 0 ? "—" : String(slots.length);
  const nowValue = current ? current.title : "Free";

  return (
    <header
      className="sticky top-0 z-30 bg-background/90 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-start gap-0.5 px-1.5 py-1.5 sm:gap-1 sm:px-3 sm:py-2">
        <Chip href="/tasks" icon={CheckSquare} label="Pending" value={String(pendingCount)} tone="primary" />
        <Chip
          href="/dashboard"
          icon={Flame}
          label="Streak"
          value={streakDays > 0 ? `${streakDays}d` : "0"}
          tone="streak"
        />
        <Chip href="/today" icon={CalendarDays} label="Slots" value={slotsLabel} tone="default" />
        <Chip
          href="/today"
          icon={Sparkles}
          label={current ? `${current.startTime}` : "Now"}
          value={nowValue}
          tone={current ? "warn" : "default"}
          wide
        />
        <Link
          href="/settings"
          className="mt-1 flex w-9 shrink-0 items-center justify-center active:scale-95 sm:mt-1.5 sm:w-10"
          aria-label="Settings"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground sm:h-9 sm:w-9">
            <Settings className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" strokeWidth={2.5} />
          </span>
        </Link>
      </div>
    </header>
  );
}
