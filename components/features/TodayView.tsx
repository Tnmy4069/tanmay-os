"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Clock, Flame, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskItem } from "@/components/features/TaskItem";
import { TaskModal } from "@/components/features/TaskModal";
import { saveWorkLogsAction } from "@/app/actions/checkin.actions";
import { parseTimeToMinutes } from "@/utils/date";

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
  mustDoTasks: any[];
  shouldDoTasks: any[];
  couldDoTasks: any[];
  unscheduledTasks: any[];
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
  overdueTasks,
  mustDoTasks,
  shouldDoTasks,
  couldDoTasks,
  unscheduledTasks,
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
    currentRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
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
    startTransition(async () => {
      await saveWorkLogsAction(`${dateStr}T00:00:00+05:30`, payload);
    });
  }

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Good focus, {userName}</p>
          <h1 className="text-3xl font-bold tracking-tight">Today</h1>
          <p className="text-muted-foreground mt-1">{dateLabel} · {clock} IST</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/personal/checklist">Checklist</Link>
          </Button>
          <TaskModal
            trigger={
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            }
          />
        </div>
      </div>

      {workload.isOverloaded && (
        <div className="bg-destructive/10 border border-destructive/40 text-destructive px-4 py-3 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Over capacity</h3>
            <p className="text-sm mt-0.5">
              {durationLabel(workload.plannedMinutes)} of tasks vs {durationLabel(workload.availableMinutes)} of Work/Focus time. Move something out.
            </p>
          </div>
        </div>
      )}

      {overdueTasks.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 px-4 py-3 rounded-xl">
          <h3 className="font-semibold text-orange-500 mb-2">{overdueTasks.length} overdue</h3>
          <ul className="space-y-2">
            {overdueTasks.slice(0, 4).map((task) => (
              <TaskItem key={String(task._id)} task={task} />
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs uppercase tracking-wide text-primary">Now</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="font-semibold truncate">{current ? current.title : "Free / between blocks"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {current ? `${current.startTime}–${current.endTime} · ${durationLabel(remaining)} left` : "No active slot"}
            </p>
            {current && (
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${currentProgress}%` }} />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Next</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="font-semibold truncate">{next ? next.title : "End of day"}</p>
            <p className="text-xs text-muted-foreground mt-1">{next ? `${next.startTime}–${next.endTime}` : "—"}</p>
          </CardContent>
        </Card>
        <Card className={capacityPct > 100 ? "border-destructive/40" : ""}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Capacity</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="font-semibold">{capacityPct}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {durationLabel(workload.plannedMinutes)} / {durationLabel(workload.availableMinutes)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs uppercase tracking-wide text-orange-500 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="font-semibold">{loggedCount}/{workingBlocks.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Working slots logged</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {current && isWorking(current.type) && (
            <Card className="border-indigo-500/30 bg-indigo-500/5">
              <CardHeader>
                <CardTitle className="text-lg">Log this slot</CardTitle>
                <CardDescription>
                  {current.title} · {current.startTime}–{current.endTime}. Write what you are doing now — this feeds your streak.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={logs[current._id] || ""}
                  onChange={(e) => setLogs((prev) => ({ ...prev, [current._id]: e.target.value }))}
                  placeholder="Kya kiya / kya kar rahe ho is block me?"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button onClick={saveNotes} disabled={isPending} size="sm">
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
          {unscheduledTasks.length > 0 && (
            <TaskColumn title="Unscheduled" description="Inbox without a date" accent="border-l-muted" empty="" tasks={unscheduledTasks} />
          )}

          {workingBlocks.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>Working slots</CardTitle>
                  <CardDescription>Work + Focus. Fill every note to keep today&apos;s streak.</CardDescription>
                </div>
                <Button onClick={saveNotes} disabled={isPending} size="sm" variant="outline">
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
                      className={`rounded-lg border p-3 space-y-2 ${isNow ? "border-primary bg-primary/5" : "bg-card"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{b.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.startTime}–{b.endTime} · {b.type}
                            {past ? " · done" : start > minutes ? " · upcoming" : " · now"}
                          </p>
                        </div>
                        {done ? (
                          <Badge variant="outline" className="text-green-500 border-green-500/40">
                            <Check className="w-3 h-3 mr-1" /> Logged
                          </Badge>
                        ) : (
                          <Badge variant="outline">Open</Badge>
                        )}
                      </div>
                      <textarea
                        value={logs[b._id] || ""}
                        onChange={(e) => setLogs((prev) => ({ ...prev, [b._id]: e.target.value }))}
                        placeholder="What did you do here?"
                        rows={2}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
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
                        ref={isActive ? currentRef : undefined}
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
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          {title}
          <span className="text-xs font-normal text-muted-foreground">{tasks.length}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
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
