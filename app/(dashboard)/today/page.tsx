import { auth } from "@/lib/auth";
import { getTodayMustDoTasks, getTasks } from "@/services/task.service";
import { getScheduleForDay } from "@/services/schedule.service";
import { calculateWorkload } from "@/utils/workload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertTriangle, Plus } from "lucide-react";
import { TaskItem } from "@/components/features/TaskItem";
import { TaskModal } from "@/components/features/TaskModal";
import { Button } from "@/components/ui/button";

export default async function TodayPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  const now = new Date();
  
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  const todaySchedule = await getScheduleForDay(userId, now.getDay());
  
  const todayTasks = await getTasks(userId, {
    status: { $ne: "Done" },
    $or: [
      { dueDate: { $gte: startOfDay, $lte: endOfDay } },
      { dueDate: { $exists: false } }
    ]
  });

  const mustDoTasks = todayTasks.filter(t => t.isMustDo);
  const shouldDoTasks = todayTasks.filter(t => !t.isMustDo && (t.priority === "P0 Critical" || t.priority === "P1 High" || t.priority === "P2 Medium"));
  const couldDoTasks = todayTasks.filter(t => !t.isMustDo && t.priority === "P3 Low");

  const workload = calculateWorkload(todaySchedule, todayTasks);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Today</h1>
          <p className="text-muted-foreground mt-1">Daily planner and smart scheduling.</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <p className="font-medium hidden md:block">{format(now, "EEEE, MMMM d")}</p>
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
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">You are over capacity today.</h3>
            <p className="text-sm mt-1">
              You planned {Math.round(workload.plannedMinutes / 60 * 10) / 10}h of tasks, but only have {Math.round(workload.availableMinutes / 60 * 10) / 10}h of available focus time. Consider moving some tasks.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MUST DO */}
        <Card className="border-l-4 border-l-destructive">
          <CardHeader>
            <CardTitle className="text-xl">🔴 MUST DO (Max 3)</CardTitle>
            <CardDescription>Critical tasks for today</CardDescription>
          </CardHeader>
          <CardContent>
            {mustDoTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No critical tasks.</p>
            ) : (
              <ul className="space-y-3">
                {mustDoTasks.map(task => (
                  <TaskItem key={String(task._id)} task={task} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* SHOULD DO */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="text-xl">🟡 SHOULD DO</CardTitle>
            <CardDescription>Important but not critical</CardDescription>
          </CardHeader>
          <CardContent>
            {shouldDoTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No medium/high priority tasks.</p>
            ) : (
              <ul className="space-y-3">
                {shouldDoTasks.map(task => (
                  <TaskItem key={String(task._id)} task={task} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* COULD DO */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-xl">🟢 COULD DO</CardTitle>
            <CardDescription>Low priority tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {couldDoTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No low priority tasks.</p>
            ) : (
              <ul className="space-y-3">
                {couldDoTasks.map(task => (
                  <TaskItem key={String(task._id)} task={task} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        
        {/* FIXED ROUTINE TIMELINE */}
        <Card className="border-l-4 border-l-primary lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">📅 FIXED ROUTINE</CardTitle>
            <CardDescription>Your immutable schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
               <p className="text-sm text-muted-foreground">No fixed routine found for today.</p>
            ) : (
              <div className="flex flex-col space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {todaySchedule.map((block, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Icon / dot */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-accent text-accent-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-bold text-xs">
                      {block.startTime.split(":")[0]}
                    </div>
                    {/* Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border p-4 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-sm text-primary">{block.startTime} - {block.endTime}</div>
                        <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{block.type}</span>
                      </div>
                      <div className="font-semibold">{block.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
