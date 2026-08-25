import { auth } from "@/lib/auth";
import { getTodayMustDoTasks, getTasks } from "@/services/task.service";
import { getScheduleForDay } from "@/services/schedule.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskItem } from "@/components/features/TaskItem";
import { parseTimeToMinutes, formatIST, getDayOfWeekIST, getStartOfTodayIST, TIMEZONE } from "@/utils/date";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const now = new Date();
  const todaySchedule = await getScheduleForDay(userId, getDayOfWeekIST());
  const mustDoTasks = await getTodayMustDoTasks(userId);
  const startOfDay = getStartOfTodayIST();
  const allTasks = await getTasks(userId, { status: { $ne: "Done" } });

  const overdueTasks = allTasks.filter((t) => t.dueDate && new Date(t.dueDate) < startOfDay);
  const todayTasks = allTasks.filter(
    (t) => !t.dueDate || (new Date(t.dueDate) >= startOfDay && new Date(t.dueDate) <= new Date(startOfDay.getTime() + 86400000))
  );

  const plannedMinutes = todayTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const availableFocusBlocks = todaySchedule.filter((b) => b.type === "Focus" || b.type === "Work");
  const availableMinutes = availableFocusBlocks.reduce((acc, b) => {
    return acc + (parseTimeToMinutes(b.endTime) - parseTimeToMinutes(b.startTime));
  }, 0);
  const workloadPercent = availableMinutes > 0 ? Math.round((plannedMinutes / availableMinutes) * 100) : 0;

  // Use IST hours/minutes — server may run in UTC on prod
  const nowISTStr = formatInTimeZone(now, TIMEZONE, "HH:mm");
  const currentMinutes = parseTimeToMinutes(nowISTStr);
  let currentBlock = null;
  let nextBlock = null;

  for (let i = 0; i < todaySchedule.length; i++) {
    const b = todaySchedule[i];
    const startMins = parseTimeToMinutes(b.startTime);
    const endMins = parseTimeToMinutes(b.endTime);
    if (currentMinutes >= startMins && currentMinutes < endMins) {
      currentBlock = b;
      nextBlock = todaySchedule[i + 1] || null;
      break;
    } else if (currentMinutes < startMins && !currentBlock) {
      nextBlock = b;
      break;
    }
  }

  return (
    <div className="app-page max-w-7xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{formatIST(now, "EEEE, MMM d")}</p>
          <h1 className="text-2xl font-semibold tracking-tight truncate">
            Hey, {session.user.name?.split(" ")[0] || "Tanmay"}
          </h1>
        </div>
        <Badge variant="outline" className="mt-1 max-w-[46%] shrink-0 truncate border-primary/30 text-primary">
          {currentBlock ? currentBlock.title : "Free time"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Card className="bg-primary/10 border-primary/20">
              <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-primary">Now</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-sm sm:text-lg font-semibold leading-tight line-clamp-2">
                  {currentBlock ? currentBlock.title : "None"}
                </div>
                <div className="text-[11px] sm:text-sm text-muted-foreground mt-1 tabular-nums">
                  {currentBlock ? `${currentBlock.startTime}–${currentBlock.endTime}` : "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">Next</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-sm sm:text-lg font-semibold leading-tight line-clamp-2">
                  {nextBlock ? nextBlock.title : "End of day"}
                </div>
                <div className="text-[11px] sm:text-sm text-muted-foreground mt-1 tabular-nums">
                  {nextBlock ? `${nextBlock.startTime}–${nextBlock.endTime}` : "—"}
                </div>
              </CardContent>
            </Card>
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-destructive">Overdue</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-destructive">{overdueTasks.length}</div>
                <div className="text-[11px] sm:text-sm text-muted-foreground mt-1">Need attention</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Must do today</CardTitle>
              <CardDescription className="hidden sm:block">Keep this list at three or fewer.</CardDescription>
            </CardHeader>
            <CardContent>
              {mustDoTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-white/10 px-4 py-5">
                  Clear. No critical tasks pending.
                </p>
              ) : (
                <ul className="space-y-2">
                  {mustDoTasks.map((task) => (
                    <TaskItem key={String(task._id)} task={task} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base sm:text-lg">Load</CardTitle>
                <span className="text-sm font-medium text-primary tabular-nums">{workloadPercent}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${workloadPercent > 100 ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${Math.min(workloadPercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round((plannedMinutes / 60) * 10) / 10}h planned / {Math.round((availableMinutes / 60) * 10) / 10}h available
              </p>
              <Button asChild className="mt-4 w-full sm:w-auto">
                <Link href="/today">
                  Run today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-6 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Today&apos;s routine</CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
              <p className="text-sm text-muted-foreground">No routine set.</p>
            ) : (
              <>
                <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:none] lg:hidden">
                  {todaySchedule.map((block) => {
                    const isActive = currentBlock && String(currentBlock._id) === String(block._id);
                    return (
                      <div
                        key={`m-${String(block._id)}`}
                        className={`min-w-[38%] snap-start rounded-2xl border px-3 py-2.5 ${
                          isActive ? "border-primary/40 bg-primary/10" : "border-white/5 bg-white/[0.02] opacity-70"
                        }`}
                      >
                        <p className="text-[11px] tabular-nums text-muted-foreground">{block.startTime}</p>
                        <p className={`text-sm leading-snug line-clamp-2 ${isActive ? "font-semibold text-primary" : "font-medium"}`}>
                          {block.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="relative hidden border-l border-white/10 ml-3 space-y-5 lg:block">
                  {todaySchedule.map((block) => {
                    const isActive = currentBlock && String(currentBlock._id) === String(block._id);
                    return (
                      <div key={String(block._id)} className={`relative pl-5 ${isActive ? "" : "opacity-60"}`}>
                        <div
                          className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ${
                            isActive ? "bg-primary ring-4 ring-primary/20" : "bg-muted-foreground/50"
                          }`}
                        />
                        <p className="text-xs text-muted-foreground">{block.startTime}</p>
                        <p className={`text-sm ${isActive ? "font-semibold text-primary" : "font-medium"}`}>{block.title}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
