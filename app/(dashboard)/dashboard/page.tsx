import { auth } from "@/lib/auth";
import { getTodayMustDoTasks, getTasks } from "@/services/task.service";
import { getScheduleForDay } from "@/services/schedule.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TaskItem } from "@/components/features/TaskItem";
import { parseTimeToMinutes } from "@/utils/date";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  const now = new Date();
  
  const todaySchedule = await getScheduleForDay(userId, now.getDay());
  const mustDoTasks = await getTodayMustDoTasks(userId);
  
  // Real workload & overdue
  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
  const allTasks = await getTasks(userId, { status: { $ne: "Done" } });
  
  const overdueTasks = allTasks.filter(t => t.dueDate && new Date(t.dueDate) < startOfDay);
  const todayTasks = allTasks.filter(t => !t.dueDate || (new Date(t.dueDate) >= startOfDay && new Date(t.dueDate) <= new Date(startOfDay.getTime() + 86400000)));
  
  const plannedMinutes = todayTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const availableFocusBlocks = todaySchedule.filter(b => b.type === "Focus" || b.type === "Work");
  const availableMinutes = availableFocusBlocks.reduce((acc, b) => {
    return acc + (parseTimeToMinutes(b.endTime) - parseTimeToMinutes(b.startTime));
  }, 0);
  
  const workloadPercent = availableMinutes > 0 ? Math.round((plannedMinutes / availableMinutes) * 100) : 0;

  // Current & Next block calculation
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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good evening, {session.user.name?.split(' ')[0] || 'User'}</h1>
          <p className="text-muted-foreground mt-1">Here is what you need to focus on right now.</p>
        </div>
        <div className="text-right">
          <p className="font-medium text-lg">{format(now, "EEEE, MMM d")}</p>
          <Badge variant="outline" className="mt-1 font-medium bg-background">
            {currentBlock ? `Current: ${currentBlock.title}` : 'Free Time'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN - TASKS */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-primary uppercase">Current Block</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate">{currentBlock ? currentBlock.title : "None"}</div>
                <div className="text-sm mt-1 opacity-80">{currentBlock ? `${currentBlock.startTime} - ${currentBlock.endTime}` : "-"}</div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase">Next Block</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate">{nextBlock ? nextBlock.title : "End of day"}</div>
                <div className="text-sm mt-1 text-muted-foreground">{nextBlock ? `${nextBlock.startTime} - ${nextBlock.endTime}` : "-"}</div>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive uppercase">Overdue Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{overdueTasks.length}</div>
                <div className="text-sm mt-1 text-destructive/80">Require immediate attention</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive animate-pulse"></span>
                MUST DO TODAY
              </CardTitle>
              <CardDescription>
                Maximum 3 critical tasks allowed per day.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mustDoTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                  Your day is clear. No critical tasks pending.
                </div>
              ) : (
                <ul className="space-y-3">
                  {mustDoTasks.map(task => (
                    <TaskItem key={String(task._id)} task={task} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* REAL METRICS PLACEHOLDER */}
          <Card>
            <CardHeader>
              <CardTitle>METRICS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 border p-4 rounded-lg bg-card">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Workload Capacity</span>
                    <span className="font-medium text-primary">{workloadPercent}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-2">
                    <div className={`h-full rounded-full ${workloadPercent > 100 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${Math.min(workloadPercent, 100)}%` }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Planned: {Math.round(plannedMinutes/60*10)/10}h / Available: {Math.round(availableMinutes/60*10)/10}h</p>
                </div>
                <div className="space-y-2 border p-4 rounded-lg bg-muted/30 flex items-center justify-center flex-col">
                  <span className="text-muted-foreground font-medium text-sm">Career Tracking</span>
                  <span className="text-xs text-muted-foreground/70 mt-1">Not tracked yet</span>
                </div>
                <div className="space-y-2 border p-4 rounded-lg bg-muted/30 flex items-center justify-center flex-col">
                  <span className="text-muted-foreground font-medium text-sm">IITM Progress</span>
                  <span className="text-xs text-muted-foreground/70 mt-1">Not tracked yet</span>
                </div>
                <div className="space-y-2 border p-4 rounded-lg bg-muted/30 flex items-center justify-center flex-col">
                  <span className="text-muted-foreground font-medium text-sm">Fitness Stats</span>
                  <span className="text-xs text-muted-foreground/70 mt-1">Not tracked yet</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - SCHEDULE */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📅 TODAY&apos;S ROUTINE
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaySchedule.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No routine set for today.
                </div>
              ) : (
                <div className="relative border-l-2 border-muted ml-3 space-y-6">
                  {todaySchedule.map((block, idx) => {
                    const isFocus = block.type === "Focus";
                    const isCommute = block.type === "Commute";
                    const isWork = block.type === "Work";
                    const isActive = currentBlock && currentBlock._id === block._id;
                    
                    return (
                      <div key={idx} className={`relative pl-6 ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100 transition-opacity'}`}>
                        {/* Timeline dot */}
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-background ${
                          isActive ? "bg-green-500 animate-pulse ring-4 ring-green-500/20" :
                          isFocus ? "bg-primary" : 
                          isWork ? "bg-blue-500" : 
                          isCommute ? "bg-orange-500" : "bg-muted-foreground"
                        }`} />
                        
                        <div className="flex items-baseline gap-3">
                          <span className={`text-sm w-12 flex-shrink-0 ${isActive ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground'}`}>{block.startTime}</span>
                          <div>
                            <p className={`text-sm ${isActive ? 'font-bold text-primary' : 'font-medium text-foreground'}`}>
                              {block.title}
                            </p>
                          </div>
                        </div>
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
