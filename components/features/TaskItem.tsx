"use client";

import { useState, useTransition } from "react";
import { Check, Clock, Flag } from "lucide-react";
import { toggleTaskStatusAction } from "@/app/actions/task.actions";
import { TaskModal } from "./TaskModal";
import type { ClientTask } from "@/lib/serialize";
import { mutateWithOffline, putLocal } from "@/lib/offline/mutate";

const PRIORITY_TONE: Record<string, string> = {
  "P0 Critical": "text-red-400 bg-red-500/10",
  "P1 High": "text-orange-400 bg-orange-500/10",
  "P2 Medium": "text-yellow-400 bg-yellow-500/10",
  "P3 Low": "text-zinc-400 bg-secondary",
};

export function TaskItem({ task }: { task: ClientTask }) {
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(task.status === "Done");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = isDone ? "Not Started" : "Done";
    setIsDone(!isDone);

    startTransition(async () => {
      try {
        await mutateWithOffline({
          action: "toggleTaskStatus",
          payload: { taskId: task._id, status: newStatus },
          onlineFn: () => toggleTaskStatusAction(task._id, newStatus),
          offlineApply: async () => {
            await putLocal("tasks", { ...task, status: newStatus });
          },
        });
      } catch {
        setIsDone(isDone);
      }
    });
  };

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-3 p-3.5 min-h-[52px] rounded-2xl border border-border duration-200 ease-out hover:border-primary/30 hover:bg-secondary/40 active:scale-[0.99] cursor-pointer ${
          isDone ? "opacity-50" : ""
        }`}
      >
        <button
          onClick={toggleStatus}
          disabled={isPending}
          className={`flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center transition-colors
            ${isDone ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary"}`}
        >
          {isDone && <Check className="w-3.5 h-3.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm truncate ${isDone ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
            {task.startTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.startTime}
                {task.endTime ? `–${task.endTime}` : ""}
              </span>
            )}
            {task.category && <span className="truncate">{task.category}</span>}
          </div>
        </div>

        <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_TONE[task.priority] || PRIORITY_TONE["P2 Medium"]}`}>
          <Flag className="w-3 h-3" />
          {task.priority.replace("P0 ", "").replace("P1 ", "").replace("P2 ", "").replace("P3 ", "")}
        </span>
      </div>

      {isModalOpen && (
        <TaskModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} task={task} />
      )}
    </>
  );
}
