"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Check, Flame } from "lucide-react";
import { getMonthCheckins, saveWorkLogsAction } from "@/app/actions/checkin.actions";
import { mutateWithOffline, putLocal } from "@/lib/offline/mutate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type WorkLog = {
  blockId: string;
  title: string;
  type?: string;
  startTime: string;
  endTime: string;
  note: string;
};

type Checkin = {
  date: string;
  followedRoutine: boolean;
  workLogs?: WorkLog[];
};

type WorkBlock = {
  _id: string;
  title: string;
  type?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type Props = {
  initialYear: number;
  initialMonth: number;
  initialCheckins: Checkin[];
  workBlocks: WorkBlock[];
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKeyFromIso(iso: string) {
  const d = new Date(iso);
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split("T")[0];
}

function weekdayFromDateStr(dateStr: string) {
  return new Date(`${dateStr}T12:00:00+05:30`).getDay();
}

function prevDateStr(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d - 1));
  return next.toISOString().slice(0, 10);
}

export function MonthlyChecklist({
  initialYear,
  initialMonth,
  initialCheckins,
  workBlocks,
}: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [checkins, setCheckins] = useState<Record<string, Checkin>>(() => {
    const m: Record<string, Checkin> = {};
    initialCheckins.forEach((c) => {
      m[dateKeyFromIso(c.date)] = c;
    });
    return m;
  });
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [draftLogs, setDraftLogs] = useState<WorkLog[]>([]);

  const today = new Date();
  const todayStr = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split("T")[0];

  function mergeCheckins(list: Checkin[]) {
    setCheckins((prev) => {
      const next = { ...prev };
      list.forEach((c) => {
        next[dateKeyFromIso(c.date)] = c;
      });
      return next;
    });
  }

  function goToPrev() {
    const nextMonth = month === 1 ? 12 : month - 1;
    const nextYear = month === 1 ? year - 1 : year;
    setMonth(nextMonth);
    setYear(nextYear);
    startTransition(async () => {
      mergeCheckins(await getMonthCheckins(nextYear, nextMonth));
    });
  }

  function goToNext() {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    if (nextYear > today.getFullYear() || (nextYear === today.getFullYear() && nextMonth > today.getMonth() + 1)) {
      return;
    }
    setMonth(nextMonth);
    setYear(nextYear);
    startTransition(async () => {
      mergeCheckins(await getMonthCheckins(nextYear, nextMonth));
    });
  }

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length < totalCells) days.push(null);

  function workBlocksForDate(dateStr: string) {
    const dow = weekdayFromDateStr(dateStr);
    return workBlocks
      .filter((b) => b.dayOfWeek === dow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function isDayComplete(dateStr: string) {
    const blocks = workBlocksForDate(dateStr);
    if (blocks.length === 0) return false;
    const logs = checkins[dateStr]?.workLogs || [];
    return blocks.every((block) => {
      const log = logs.find((l) => l.blockId === block._id);
      return Boolean(log?.note?.trim());
    });
  }

  function openDay(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (dateStr > todayStr) return;

    const blocks = workBlocksForDate(dateStr);
    const existing = checkins[dateStr]?.workLogs || [];
    setDraftLogs(
      blocks.map((block) => {
        const found = existing.find((l) => l.blockId === block._id);
        return {
          blockId: block._id,
          title: block.title,
          type: block.type,
          startTime: block.startTime,
          endTime: block.endTime,
          note: found?.note || "",
        };
      })
    );
    setSelectedDate(dateStr);
  }

  function saveDay() {
    if (!selectedDate) return;
    const dateStr = selectedDate;
    const logs = draftLogs;
    const complete = logs.length > 0 && logs.every((l) => l.note.trim().length > 0);

    setCheckins((prev) => ({
      ...prev,
      [dateStr]: {
        date: `${dateStr}T00:00:00.000Z`,
        followedRoutine: complete,
        workLogs: logs,
      },
    }));
    setSelectedDate(null);

    startTransition(async () => {
      await mutateWithOffline({
        action: "saveWorkLogs",
        payload: { dateStr: `${dateStr}T00:00:00+05:30`, workLogs: logs },
        onlineFn: () => saveWorkLogsAction(`${dateStr}T00:00:00+05:30`, logs),
        offlineApply: async () => {
          await putLocal("checkins", {
            _id: `local-${dateStr}`,
            date: `${dateStr}T00:00:00.000Z`,
            followedRoutine: complete,
            notes: "",
            workLogs: logs,
          });
        },
      });
    });
  }

  const monthDateStrs = useMemo(() => {
    const list: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const s = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (s <= todayStr) list.push(s);
    }
    return list;
  }, [year, month, daysInMonth, todayStr]);

  const doneCount = monthDateStrs.filter((s) => isDayComplete(s)).length;
  const totalPast = monthDateStrs.length;
  const percent = totalPast > 0 ? Math.round((doneCount / totalPast) * 100) : 0;

  let streak = 0;
  let cursor = todayStr;
  for (let i = 0; i < 400; i++) {
    const blocks = workBlocksForDate(cursor);
    if (blocks.length === 0) {
      cursor = prevDateStr(cursor);
      continue;
    }
    if (cursor === todayStr && !isDayComplete(cursor)) {
      cursor = prevDateStr(cursor);
      continue;
    }
    if (isDayComplete(cursor)) {
      streak++;
      cursor = prevDateStr(cursor);
      continue;
    }
    break;
  }

  const selectedLabel = selectedDate
    ? new Date(`${selectedDate}T12:00:00+05:30`).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="text-center p-3 sm:p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="text-xl sm:text-3xl font-bold text-primary">{doneCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Work days logged</div>
        </div>
        <div className="text-center p-3 sm:p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
          <div className="text-xl sm:text-3xl font-bold text-orange-500 flex items-center justify-center gap-1">
            <Flame className="w-4 h-4 sm:w-6 sm:h-6" />{streak}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Current streak</div>
        </div>
        <div className="text-center p-3 sm:p-4 rounded-xl bg-green-500/5 border border-green-500/20">
          <div className="text-xl sm:text-3xl font-bold text-green-500">{percent}%</div>
          <div className="text-xs text-muted-foreground mt-1">This month</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Work-block notes</span>
          <span>{doneCount} / {totalPast} days</span>
        </div>
        <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

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

      <div className="rounded-xl border overflow-hidden bg-card">
        <div className="grid grid-cols-7 border-b">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold text-muted-foreground sm:text-xs">
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="aspect-square border-r border-b border-border/30 bg-muted/20" />;
            }

            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const isDone = isDayComplete(dateStr);
            const blocks = workBlocksForDate(dateStr);
            const logs = checkins[dateStr]?.workLogs || [];
            const filled = blocks.filter((b) => logs.find((l) => l.blockId === b._id)?.note?.trim()).length;

            return (
              <button
                key={day}
                onClick={() => openDay(day)}
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
                {isDone && <Check className="w-3.5 h-3.5 text-green-500" />}
                {!isDone && !isFuture && blocks.length > 0 && (
                  <span className="text-[9px] text-muted-foreground">
                    {filled}/{blocks.length}
                  </span>
                )}
                {!isDone && !isFuture && blocks.length === 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Click a day to note what you did in Work and Focus slots. Streak grows when every working slot that day has a note.
      </p>

      <Dialog open={Boolean(selectedDate)} onOpenChange={(open) => { if (!open) setSelectedDate(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Working slots — {selectedLabel}</DialogTitle>
            <DialogDescription>
              Internship, focus, and other working blocks. Fill every slot to keep the streak.
            </DialogDescription>
          </DialogHeader>

          {draftLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No Work or Focus blocks on this weekday. Add them in Settings → Routine.
            </p>
          ) : (
            <div className="space-y-4">
              {draftLogs.map((log, i) => (
                <div
                  key={log.blockId}
                  className={`space-y-1.5 rounded-lg border p-3 ${
                    log.type === "Focus"
                      ? "bg-blue-500/5 border-blue-500/20"
                      : "bg-indigo-500/5 border-indigo-500/20"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{log.title}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{log.type || "Work"}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {log.startTime} – {log.endTime}
                    </p>
                  </div>
                  <textarea
                    value={log.note}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDraftLogs((prev) => prev.map((item, idx) => (idx === i ? { ...item, note: value } : item)));
                    }}
                    placeholder="Kya kiya is slot me?"
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDate(null)}>
              Cancel
            </Button>
            <Button onClick={saveDay} disabled={isPending || draftLogs.length === 0}>
              Save notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
