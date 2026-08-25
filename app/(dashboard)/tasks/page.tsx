import { auth } from "@/lib/auth";
import { getTasks } from "@/services/task.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TaskItem } from "@/components/features/TaskItem";
import { TaskModal } from "@/components/features/TaskModal";
import { Button } from "@/components/ui/button";
import { CheckSquare, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const tasks = await getTasks(session.user.id, { status: { $ne: "Done" } });
  const mustDoTasks = tasks.filter((t) => t.isMustDo);
  const otherTasks = tasks.filter((t) => !t.isMustDo);

  return (
    <div className="app-page max-w-5xl">
      <PageHeader
        title="Tasks"
        description="Backlog and must-dos in one place. Check a box to complete."
        icon={CheckSquare}
        actions={
          <TaskModal
            trigger={
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add task
              </Button>
            }
          />
        }
      />

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Must do</CardTitle>
            <CardDescription>Hard cap of 3 when they are scheduled for a day.</CardDescription>
          </CardHeader>
          <CardContent>
            {mustDoTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No critical tasks.</p>
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
            <CardTitle className="text-lg">Everything else</CardTitle>
            <CardDescription>{otherTasks.length} open</CardDescription>
          </CardHeader>
          <CardContent>
            {otherTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Backlog is clear.</p>
            ) : (
              <ul className="space-y-2">
                {otherTasks.map((task) => (
                  <TaskItem key={task._id} task={task} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
