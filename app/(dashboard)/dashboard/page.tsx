import { auth } from "@/lib/auth";
import { getTodayMustDoTasks, getTasks } from "@/services/task.service";
import { getScheduleForDay } from "@/services/schedule.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskItem } from "@/components/features/TaskItem";
import { parseTimeToMinutes, formatIST, getDayOfWeekIST, getStartOfTodayIST, getEndOfWeekIST, TIMEZONE } from "@/utils/date";
import { formatInTimeZone } from "date-fns-tz";
import { StatRow } from "@/components/layout/StatRow";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckSquare } from "lucide-react";
import Link from "next/link";
import { taskDeadline } from "@/lib/task-dates";
import { GameHUD } from "@/components/features/GameHUD";
import { computeGameStats } from "@/lib/gamification";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const now = new Date();
  const todayKey = formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd");
  const todaySchedule = await getScheduleForDay(userId, getDayOfWeekIST());
  const mustDoTasks = await getTodayMustDoTasks(userId);
  const startOfDay = getStartOfTodayIST();
  const [allTasks, doneTasks] = await Promise.all([
    getTasks(userId, { status: { $ne: "Done" } }),
    getTasks(userId, { status: "Done" }),
  ]);

  const gameStats = computeGameStats({
    allTasks: [...allTasks, ...doneTasks],
    mustDoTasks,
    todayKey,
    activeDayKeys: doneTasks
      .map((t) => (t.updatedAt ? formatInTimeZone(new Date(t.updatedAt), TIMEZONE, "yyyy-MM-dd") : null))
      .filter(Boolean) as string[],
  });

  const endOfDay = new Date(startOfDay.getTime() + 86400000);
  const endOfWeek = getEndOfWeekIST();
  const pendingCount = allTasks.filter((t) => t.status !== "Cancelled").length;

  const overdueTasks = allTasks.filter((t) => {
    const d = taskDeadline(t);
    return d && new Date(d) < startOfDay;
  });
  const todayTasks = allTasks.filter((t) => {
    const d = taskDeadline(t);
    if (!d) return true;
    return new Date(d) >= startOfDay && new Date(d) <= endOfDay;
  });

  const dueTodayTasks = allTasks.filter((t) => {
    if (t.isMustDo) return false;
    const d = taskDeadline(t);
    if (!d) return false;
    const date = new Date(d);
    return date >= startOfDay && date <= endOfDay;
  });

  const thisWeekUpcoming = allTasks
    .filter((t) => {
      const d = taskDeadline(t);
      if (!d) return false;
      const date = new Date(d);
      return date > endOfDay && date <= endOfWeek;
    })
    .sort((a, b) => {
      const da = taskDeadline(a) || "";
      const db = taskDeadline(b) || "";
      return da.localeCompare(db);
    });

  const backlogTasks = allTasks.filter((t) => !t.isMustDo && !taskDeadline(t));

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
          <p className="type-caption">Today · {formatIST(now, "EEEE")}</p>
          <h1 className="type-h1 truncate">
            Hey, {session.user.name?.split(" ")[0] || "Tanmay"}!
          </h1>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Ready for today&apos;s quest?</p>
        </div>
        <Badge variant="success" className="mt-1 max-w-[46%] shrink-0 truncate">
          {currentBlock ? currentBlock.title : "Free time"}
        </Badge>
      </div>

      <GameHUD stats={gameStats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <StatRow
            items={[
              {
                label: "Pending",
                value: pendingCount,
                hint: "Tap to manage all",
                tone: "primary",
                href: "/tasks",
              },
              {
                label: "Now",
                value: currentBlock ? currentBlock.title : "Free",
                hint: currentBlock ? `${currentBlock.startTime}–${currentBlock.endTime}` : "No active slot",
                tone: "info",
              },
              {
                label: "Next",
                value: nextBlock ? nextBlock.title : "End of day",
                hint: nextBlock ? `${nextBlock.startTime}–${nextBlock.endTime}` : "—",
                tone: "next",
              },
              {
                label: "Overdue",
                value: overdueTasks.length,
                hint: overdueTasks.length ? "Need attention" : "All clear",
                tone: overdueTasks.length ? "danger" : "default",
                href: overdueTasks.length ? "/today" : undefined,
              },
            ]}
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Must do today</CardTitle>
              <CardDescription className="hidden sm:block">Keep this list at three or fewer.</CardDescription>
            </CardHeader>
            <CardContent>
              {mustDoTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border px-4 py-5">
                  Clear. No critical tasks pending.
                </p>
              ) : (() => {
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

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">This week</CardTitle>
                  <CardDescription className="hidden sm:block">
                    Upcoming through end of week
                  </CardDescription>
                </div>
                <Badge variant="secondary">{thisWeekUpcoming.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {thisWeekUpcoming.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  No upcoming tasks for the rest of this week.
                </p>
              ) : (
                <ul className="space-y-2">
                  {thisWeekUpcoming.slice(0, 8).map((task) => (
                    <li key={String(task._id)}>
                      <TaskItem task={task} />
                    </li>
                  ))}
                  {thisWeekUpcoming.length > 8 && (
                    <li className="pt-1 text-center">
                      <Button variant="link" size="sm" asChild>
                        <Link href="/tasks">
                          <CheckSquare className="mr-1 h-4 w-4" />
                          View all in Tasks
                        </Link>
                      </Button>
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

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
              <div className="progress-track">
                <div
                  className={`progress-fill ${workloadPercent > 100 ? "bg-destructive" : "bg-primary"}`}
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
