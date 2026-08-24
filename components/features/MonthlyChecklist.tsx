"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Check, Flame } from "lucide-react";
import { toggleCheckinAction } from "@/app/actions/checkin.actions";

type Checkin = {
  date: string;
  followedRoutine: boolean;
};

type Props = {
  initialYear: number;
  initialMonth: number;
  initialCheckins: Checkin[];
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthlyChecklist({ initialYear, initialMonth, initialCheckins }: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [checkins, setCheckins] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    initialCheckins.forEach((c) => {
      const d = new Date(c.date);
      m[d.toISOString().split("T")[0]] = c.followedRoutine;
    });
    return m;
  });
  const [isPending, startTransition] = useTransition();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  function goToPrev() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function goToNext() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length < totalCells) days.push(null);

  function toggle(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const full = new Date(`${dateStr}T00:00:00+05:30`).toISOString();
    // Prevent toggling future dates
    if (dateStr > todayStr) return;

    const next = !checkins[dateStr];
    setCheckins((prev) => ({ ...prev, [dateStr]: next }));
    startTransition(async () => {
      await toggleCheckinAction(full);
    });
  }

  // Stats
  const doneCount = Object.values(checkins).filter(Boolean).length;
  const totalPast = days.filter((d) => {
    if (!d) return false;
    const s = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return s <= todayStr;
  }).length;
  const percent = totalPast > 0 ? Math.round((doneCount / totalPast) * 100) : 0;

  // Streak
  let streak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  while (true) {
    const s = checkDate.toISOString().split("T")[0];
    if (checkins[s]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="text-3xl font-bold text-primary">{doneCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Days followed</div>
        </div>
        <div className="text-center p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
          <div className="text-3xl font-bold text-orange-500 flex items-center justify-center gap-1">
            <Flame className="w-6 h-6" />{streak}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Current streak</div>
        </div>
        <div className="text-center p-4 rounded-xl bg-green-500/5 border border-green-500/20">
          <div className="text-3xl font-bold text-green-500">{percent}%</div>
          <div className="text-xs text-muted-foreground mt-1">This month</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Monthly consistency</span>
          <span>{doneCount} / {totalPast} days</span>
        </div>
        <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrev}
          className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <button
          onClick={goToNext}
          disabled={year === today.getFullYear() && month === today.getMonth() + 1}
          className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border overflow-hidden bg-card">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="aspect-square border-r border-b border-border/30 bg-muted/20" />;
            }

            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const isDone = checkins[dateStr] === true;

            return (
              <button
                key={day}
                onClick={() => toggle(day)}
                disabled={isFuture || isPending}
                className={`aspect-square border-r border-b border-border/30 flex flex-col items-center justify-center gap-0.5 transition-all relative group
                  ${isFuture ? "opacity-30 cursor-default bg-muted/10" : "cursor-pointer"}
                  ${isDone ? "bg-green-500/10 hover:bg-green-500/20" : !isFuture ? "hover:bg-accent/50" : ""}
                  ${isToday ? "ring-2 ring-inset ring-primary z-10" : ""}
                `}
              >
                <span className={`text-sm font-medium ${isToday ? "text-primary font-bold" : isDone ? "text-green-400" : "text-foreground"}`}>
                  {day}
                </span>
                {isDone && (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                )}
                {!isDone && !isFuture && (
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary/40 transition-colors" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Click any past day to mark whether you followed your routine. Future dates are locked.
      </p>
    </div>
  );
}
