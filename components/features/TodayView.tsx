"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Clock, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskItem } from "@/components/features/TaskItem";
import { TaskModal } from "@/components/features/TaskModal";
import { saveWorkLogsAction } from "@/app/actions/checkin.actions";
import { parseTimeToMinutes } from "@/utils/date";
import { StatRow } from "@/components/layout/StatRow";
import { mutateWithOffline, putLocal } from "@/lib/offline/mutate";

type Block = {
  _id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
};

type WorkLog = {
  blockId: string;
  title: string;
  startTime: string;
  endTime: string;
  note: string;
};

type Props = {
  dateLabel: string;
  dateStr: string;
  userName: string;
  blocks: Block[];
  workLogs: WorkLog[];
  workload: { availableMinutes: number; plannedMinutes: number; isOverloaded: boolean };
  overdueTasks: any[];
  notifyTodayTasks?: any[];
  mustDoTasks: any[];
  shouldDoTasks: any[];
  couldDoTasks: any[];
  backlogTasks: any[];
};

const TYPE_DOT: Record<string, string> = {
  Focus: "bg-blue-500",
  Work: "bg-indigo-500",
  Commute: "bg-orange-500",
  Sleep: "bg-purple-500",
  Fitness: "bg-green-500",
  Personal: "bg-pink-500",
  Relationship: "bg-rose-500",
  Free: "bg-emerald-500",
  Fixed: "bg-slate-500",
};

function istMinutesNow() {
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

function istClock() {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

function durationLabel(mins: number) {
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function isWorking(type: string) {
  return type === "Work" || type === "Focus";
}

export function TodayView({
  dateLabel,
  dateStr,
  userName,
  blocks,
  workLogs,
  workload,
  overdueTasks = [],
  notifyTodayTasks = [],
  mustDoTasks = [],
  shouldDoTasks = [],
  couldDoTasks = [],
  backlogTasks = [],
}: Props) {
  const [minutes, setMinutes] = useState(istMinutesNow);
  const [clock, setClock] = useState(istClock);
  const [logs, setLogs] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    workLogs.forEach((l) => {
      m[l.blockId] = l.note;
    });
    return m;
  });
  const [isPending, startTransition] = useTransition();
  const currentRef = useRef<HTMLDivElement | null>(null);
  const desktopCurrentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setMinutes(istMinutesNow());
      setClock(istClock());
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const { current, next, currentIdx } = useMemo(() => {
    let current: Block | null = null;
    let next: Block | null = null;
    let currentIdx = -1;
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const start = parseTimeToMinutes(b.startTime);
      let end = parseTimeToMinutes(b.endTime);
      if (end <= start) end += 24 * 60;
      if (minutes >= start && minutes < end) {
        current = b;
        currentIdx = i;
        next = blocks[i + 1] || null;
        break;
      }
      if (minutes < start && !current) {
        next = b;
        break;
      }
    }
    return { current, next, currentIdx };
  }, [blocks, minutes]);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const el = wide ? desktopCurrentRef.current : currentRef.current;
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [currentIdx]);

  const workingBlocks = blocks.filter((b) => isWorking(b.type));
  const loggedCount = workingBlocks.filter((b) => logs[b._id]?.trim()).length;
  const remaining =
    current && parseTimeToMinutes(current.endTime) > minutes
      ? parseTimeToMinutes(current.endTime) - minutes
      : current
        ? parseTimeToMinutes(current.endTime) + 24 * 60 - minutes
        : 0;
  const currentStart = current ? parseTimeToMinutes(current.startTime) : 0;
  const currentEnd = current ? parseTimeToMinutes(current.endTime) : 0;
  const currentSpan = Math.max(currentEnd - currentStart, 1);
  const currentProgress = current ? Math.min(100, Math.max(0, ((minutes - currentStart) / currentSpan) * 100)) : 0;

  const capacityPct =
    workload.availableMinutes > 0
      ? Math.round((workload.plannedMinutes / workload.availableMinutes) * 100)
      : 0;

  function saveNotes() {
    const payload = workingBlocks.map((b) => ({
      blockId: b._id,
      title: b.title,
      startTime: b.startTime,
      endTime: b.endTime,
      note: logs[b._id] || "",
    }));
    const dateKey = `${dateStr}T00:00:00+05:30`;
    startTransition(async () => {
      await mutateWithOffline({
        action: "saveWorkLogs",
        payload: { dateStr: dateKey, workLogs: payload },
        onlineFn: () => saveWorkLogsAction(dateKey, payload),
        offlineApply: async () => {
          await putLocal("checkins", {
            _id: `local-${dateStr}`,
            date: new Date(dateKey).toISOString(),
            followedRoutine: payload.every((l) => l.note.trim()),
            notes: payload.map((l) => `${l.title}: ${l.note}`).join("\n"),
            workLogs: payload,
          });
        },
      });
    });
  }

  return (
    <div className="app-page max-w-7xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {userName} · {dateLabel} · {clock}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/personal/checklist">Checklist</Link>
          </Button>
          <TaskModal
            trigger={
              <Button size="sm">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Task</span>
              </Button>
            }
          />
        </div>
      </div>

      {workload.isOverloaded && (
        <div className="bg-destructive/10 border border-destructive/40 text-destructive px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Over capacity</h3>
            <p className="text-xs sm:text-sm mt-0.5">
              {durationLabel(workload.plannedMinutes)} of tasks vs {durationLabel(workload.availableMinutes)} of Work/Focus time.
            </p>
          </div>
        </div>
      )}

      {notifyTodayTasks.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 px-3 py-3 sm:px-4 rounded-2xl">
          <h3 className="font-semibold text-primary mb-2 text-sm">
            {notifyTodayTasks.length} reminder{notifyTodayTasks.length === 1 ? "" : "s"} today
          </h3>
          <ul className="space-y-2">
            {notifyTodayTasks.slice(0, 4).map((task) => (
              <TaskItem key={`notify-${String(task._id)}`} task={task} />
            ))}
          </ul>
        </div>
      )}

      {overdueTasks.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 px-3 py-3 sm:px-4 rounded-2xl">
          <h3 className="font-semibold text-orange-500 mb-2 text-sm">{overdueTasks.length} overdue</h3>
          <ul className="space-y-2">
            {overdueTasks.slice(0, 4).map((task) => (
              <TaskItem key={String(task._id)} task={task} />
            ))}
          </ul>
        </div>
      )}

      <StatRow
        items={[
          {
            label: "Now",
            value: current ? current.title : "Free / between",
            hint: current ? `${current.startTime}–${current.endTime} · ${durationLabel(remaining)} left` : "No active slot",
            tone: "primary",
          },
          {
            label: "Next",
            value: next ? next.title : "End of day",
            hint: next ? `${next.startTime}–${next.endTime}` : "—",
          },
          {
            label: "Capacity",
            value: `${capacityPct}%`,
            hint: `${durationLabel(workload.plannedMinutes)} / ${durationLabel(workload.availableMinutes)}`,
            tone: capacityPct > 100 ? "danger" : "default",
          },
          {
            label: "Notes",
            value: `${loggedCount}/${workingBlocks.length}`,
            hint: "Slots logged",
            tone: "warn",
          },
        ]}
      />
      {current && (
        <div className="-mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${currentProgress}%` }} />
        </div>
      )}

      {blocks.length > 0 && (
        <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:none] lg:hidden">
          {blocks.map((block) => {
            const isActive = current?._id === block._id;
            return (
              <div
                key={`m-${block._id}`}
                ref={isActive ? currentRef : undefined}
                className={`min-w-[42%] snap-start rounded-2xl border px-3 py-2.5 ${
                  isActive ? "border-primary/40 bg-primary/10" : "border-border opacity-70"
                }`}
              >
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {block.startTime} · {block.type}
                </p>
                <p className={`text-sm leading-snug line-clamp-2 ${isActive ? "font-semibold text-primary" : "font-medium"}`}>
                  {block.title}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {current && isWorking(current.type) && (
            <Card className="border-indigo-500/30 bg-indigo-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Log this slot</CardTitle>
                <CardDescription>
                  {current.title} · {current.startTime}–{current.endTime}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={logs[current._id] || ""}
                  onChange={(e) => setLogs((prev) => ({ ...prev, [current._id]: e.target.value }))}
                  placeholder="Kya kiya / kya kar rahe ho is block me?"
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base sm:text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button onClick={saveNotes} disabled={isPending} className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Save notes
                </Button>
              </CardContent>
            </Card>
          )}

          <TaskColumn title="Must do" description="Max 3 critical" accent="border-l-destructive" empty="No must-do tasks. Protect this list." tasks={mustDoTasks} />
          <TaskColumn title="Due today" description="Should get done today" accent="border-l-yellow-500" empty="Nothing due today besides must-dos." tasks={shouldDoTasks} />
          {couldDoTasks.length > 0 && (
            <TaskColumn title="Could do" description="Only if energy remains" accent="border-l-green-500" empty="" tasks={couldDoTasks} />
          )}
          <TaskColumn title="Backlog" description="Everything else" accent="border-l-muted" empty="Backlog is clear." tasks={backlogTasks} />

          {workingBlocks.length > 0 && (
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">Working slots</CardTitle>
                  <CardDescription className="hidden sm:block">Work + Focus. Fill every note to keep today&apos;s streak.</CardDescription>
                </div>
                <Button onClick={saveNotes} disabled={isPending} variant="outline" className="w-full sm:w-auto">
                  Save all
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {workingBlocks.map((b) => {
                  const done = Boolean(logs[b._id]?.trim());
                  const isNow = current?._id === b._id;
                  const start = parseTimeToMinutes(b.startTime);
                  const past = minutes >= parseTimeToMinutes(b.endTime);
                  return (
                    <div
                      key={b._id}
                      className={`rounded-2xl border p-3 space-y-2 ${isNow ? "border-primary bg-primary/5" : "bg-card"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{b.title}</p>
                          <p className="text-[11px] sm:text-xs text-muted-foreground">
                            {b.startTime}–{b.endTime} · {b.type}
                            {past ? " · done" : start > minutes ? " · upcoming" : " · now"}
                          </p>
                        </div>
                        {done ? (
                          <Badge variant="outline" className="shrink-0 text-green-500 border-green-500/40">
                            <Check className="w-3 h-3 mr-1" /> Logged
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0">Open</Badge>
                        )}
                      </div>
                      <textarea
                        value={logs[b._id] || ""}
                        onChange={(e) => setLogs((prev) => ({ ...prev, [b._id]: e.target.value }))}
                        placeholder="What did you do here?"
                        rows={2}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base sm:text-sm"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="hidden lg:block lg:col-span-2">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Routine
              </CardTitle>
              <CardDescription>Scrolls to the live block</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto pr-1">
              {blocks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No routine for today. Set one in{" "}
                  <Link href="/settings/routine" className="underline">Routine Editor</Link>.
                </p>
              ) : (
                <div className="relative border-l-2 border-muted ml-3 space-y-4">
                  {blocks.map((block, idx) => {
                    const start = parseTimeToMinutes(block.startTime);
                    let end = parseTimeToMinutes(block.endTime);
                    if (end <= start) end += 24 * 60;
                    const isActive = current?._id === block._id;
                    const isPast = minutes >= end;
                    return (
                      <div
                        key={block._id}
                        ref={isActive ? desktopCurrentRef : undefined}
                        className={`relative pl-6 ${isActive ? "opacity-100" : isPast ? "opacity-40" : "opacity-80"}`}
                      >
                        <div
                          className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-background ${
                            isActive
                              ? "bg-green-500 animate-pulse ring-4 ring-green-500/20"
                              : TYPE_DOT[block.type] || "bg-muted-foreground"
                          }`}
                        />
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-sm ${isActive ? "font-bold text-primary" : "font-medium"}`}>
                              {block.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {block.startTime}–{block.endTime} · {block.type}
                            </p>
                          </div>
                          {isWorking(block.type) && logs[block._id]?.trim() && (
                            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          )}
                        </div>
                        {isActive && (
                          <p className="text-xs text-primary mt-1">{durationLabel(remaining)} remaining</p>
                        )}
                        {idx === currentIdx && next && (
                          <p className="text-[11px] text-muted-foreground mt-1">Up next: {next.title}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TaskColumn({
  title,
  description,
  accent,
  empty,
  tasks,
}: {
  title: string;
  description: string;
  accent: string;
  empty: string;
  tasks: any[];
}) {
  return (
    <Card className={`border-l-4 ${accent}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center justify-between">
          {title}
          <span className="text-xs font-normal text-muted-foreground">{tasks.length}</span>
        </CardTitle>
        <CardDescription className="hidden sm:block">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <TaskItem key={String(task._id)} task={task} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
