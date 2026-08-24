import { auth } from "@/lib/auth";
import { getTasks } from "@/services/task.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TaskItem } from "@/components/features/TaskItem";
import { TaskModal } from "@/components/features/TaskModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function TasksPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  
  // Get all active tasks
  const tasks = await getTasks(userId, {
    status: { $ne: "Done" },
  });

  const mustDoTasks = tasks.filter(t => t.isMustDo);
  const otherTasks = tasks.filter(t => !t.isMustDo);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your complete backlog and upcoming tasks.</p>
        </div>
        <div className="flex items-center gap-4 text-right">
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

      <div className="grid grid-cols-1 gap-8">
        {/* MUST DO */}
        <Card className="border-l-4 border-l-destructive">
          <CardHeader>
            <CardTitle className="text-xl">🔴 MUST DO</CardTitle>
            <CardDescription>Critical tasks (Max 3 per day limit applies if scheduled for today)</CardDescription>
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

        {/* ALL OTHER TASKS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">📋 ALL ACTIVE TASKS</CardTitle>
            <CardDescription>Everything else on your plate</CardDescription>
          </CardHeader>
          <CardContent>
            {otherTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Your backlog is clear.</p>
            ) : (
              <ul className="space-y-3">
                {otherTasks.map(task => (
                  <TaskItem key={String(task._id)} task={task} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
