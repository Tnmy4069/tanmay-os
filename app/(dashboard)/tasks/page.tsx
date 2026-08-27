import { auth } from "@/lib/auth";
import { getTasks } from "@/services/task.service";
import { TaskModal } from "@/components/features/TaskModal";
import { TasksBoard } from "@/components/features/TasksBoard";
import { Button } from "@/components/ui/button";
import { CheckSquare, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  let mustDoTasks: any[] = [];
  let otherTasks: any[] = [];
  try {
    const tasks = await getTasks(session.user.id, { status: { $ne: "Done" } });
    mustDoTasks = tasks.filter((t) => t.isMustDo);
    otherTasks = tasks.filter((t) => !t.isMustDo);
  } catch {
    // Offline / DB unavailable — TasksBoard hydrates from IndexedDB
  }

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

      <TasksBoard mustDoTasks={mustDoTasks} otherTasks={otherTasks} />
    </div>
  );
}
