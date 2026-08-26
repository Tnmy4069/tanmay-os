import { auth } from "@/lib/auth";
import { getTodayMustDoTasks, getTasks } from "@/services/task.service";
import { getScheduleForDay } from "@/services/schedule.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskItem } from "@/components/features/TaskItem";
import { parseTimeToMinutes, formatIST, getDayOfWeekIST, getStartOfTodayIST, TIMEZONE } from "@/utils/date";
import { formatInTimeZone } from "date-fns-tz";
import { StatRow } from "@/components/layout/StatRow";
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

  const dueTodayTasks = allTasks.filter((t) => {
    if (t.isMustDo) return false;
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d >= startOfDay && d <= new Date(startOfDay.getTime() + 86400000);
  });

  const backlogTasks = allTasks.filter((t) => !t.isMustDo && !t.dueDate);

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
          <StatRow
            items={[
              {
                label: "Now",
                value: currentBlock ? currentBlock.title : "None",
                hint: currentBlock ? `${currentBlock.startTime}–${currentBlock.endTime}` : "—",
                tone: "primary",
              },
              {
                label: "Next",
                value: nextBlock ? nextBlock.title : "End of day",
                hint: nextBlock ? `${nextBlock.startTime}–${nextBlock.endTime}` : "—",
              },
              {
                label: "Overdue",
                value: overdueTasks.length,
                hint: "Need attention",
                tone: "danger",
              },
            ]}
          />

          {mustDoTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Must do today</CardTitle>
                <CardDescription className="hidden sm:block">Keep this list at three or fewer.</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const pending = mustDoTasks.filter((t) => t.status !== "Done");
                  const done = mustDoTasks.filter((t) => t.status === "Done");
                  return (
                    <ul className="space-y-2">
                      {pending.map((task) => (
                        <TaskItem key={String(task._id)} task={task} />
                      ))}
                      {done.length > 0 && pending.length > 0 && (
                        <li className="flex items-center gap-2 py-1">
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Done</span>
                          <div className="h-px flex-1 bg-border" />
                        </li>
                      )}
                      {done.map((task) => (
                        <TaskItem key={String(task._id)} task={task} />
                      ))}
                      {pending.length === 0 && done.length > 0 && (
                        <li className="text-sm text-primary/80 font-medium text-center py-1">✓ All done!</li>
                      )}
                    </ul>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {dueTodayTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Due today</CardTitle>
                <CardDescription className="hidden sm:block">Tasks that should get done today.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dueTodayTasks.map((task) => (
                    <TaskItem key={String(task._id)} task={task} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {backlogTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Backlog</CardTitle>
                <CardDescription className="hidden sm:block">Everything else without a due date.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {backlogTasks.slice(0, 5).map((task) => (
                    <TaskItem key={String(task._id)} task={task} />
                  ))}
                  {backlogTasks.length > 5 && (
                    <li className="text-center pt-2">
                      <Button variant="link" size="sm" asChild className="text-muted-foreground">
                        <Link href="/today">View {backlogTasks.length - 5} more in Today</Link>
                      </Button>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

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
                          isActive ? "border-primary/40 bg-primary/10" : "border-border opacity-70"
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
                <div className="relative hidden border-l border-border ml-3 space-y-5 lg:block">
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
