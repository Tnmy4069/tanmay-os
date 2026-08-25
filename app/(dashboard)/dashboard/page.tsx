import { auth } from "@/lib/auth";
import { getTodayMustDoTasks, getTasks } from "@/services/task.service";
import { getScheduleForDay } from "@/services/schedule.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskItem } from "@/components/features/TaskItem";
import { parseTimeToMinutes, formatIST, getDayOfWeekIST, getStartOfTodayIST } from "@/utils/date";
import { PageHeader } from "@/components/layout/PageHeader";
import { LayoutDashboard } from "lucide-react";
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

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
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
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title={`Hey, ${session.user.name?.split(" ")[0] || "Tanmay"}`}
        description="One screen for now, next, and what cannot slip."
        icon={LayoutDashboard}
        actions={
          <div className="text-right">
            <p className="font-medium">{formatIST(now, "EEEE, MMM d")}</p>
            <Badge variant="outline" className="mt-1 border-primary/30 text-primary">
              {currentBlock ? currentBlock.title : "Free time"}
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-primary/10 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-primary">Now</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold truncate">{currentBlock ? currentBlock.title : "None"}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {currentBlock ? `${currentBlock.startTime} – ${currentBlock.endTime}` : "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Next</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold truncate">{nextBlock ? nextBlock.title : "End of day"}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {nextBlock ? `${nextBlock.startTime} – ${nextBlock.endTime}` : "—"}
                </div>
              </CardContent>
            </Card>
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-destructive">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-destructive">{overdueTasks.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Need attention</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Must do today</CardTitle>
              <CardDescription>Keep this list at three or fewer.</CardDescription>
            </CardHeader>
            <CardContent>
              {mustDoTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-white/10 p-6">
                  Clear. No critical tasks pending.
                </p>
              ) : (
                <ul className="space-y-2">
                  {mustDoTasks.map((task) => (
                    <TaskItem key={task._id} task={task} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Load</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 rounded-2xl border border-white/5 p-4 bg-white/[0.02]">
                <div className="flex justify-between text-sm">
                  <span>Work + focus capacity</span>
                  <span className="text-primary font-medium">{workloadPercent}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${workloadPercent > 100 ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${Math.min(workloadPercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((plannedMinutes / 60) * 10) / 10}h planned / {Math.round((availableMinutes / 60) * 10) / 10}h available
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Open <Link className="text-primary underline-offset-4 hover:underline" href="/today">Today</Link> to log work notes and run the day.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s routine</CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
              <p className="text-sm text-muted-foreground">No routine set.</p>
            ) : (
              <div className="relative border-l border-white/10 ml-3 space-y-5">
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
