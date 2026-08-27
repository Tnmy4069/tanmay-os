"use client";

import { useState, useTransition } from "react";
import { Bell, CalendarRange, Check, Clock, Flag } from "lucide-react";
import { toggleTaskStatusAction } from "@/app/actions/task.actions";
import { TaskModal } from "./TaskModal";
import type { ClientTask } from "@/lib/serialize";
import { mutateWithOffline, putLocal } from "@/lib/offline/mutate";
import { formatTaskDate, isTaskDateToday, isTaskOverdue, taskDeadline } from "@/lib/task-dates";

const PRIORITY_TONE: Record<string, string> = {
  "P0 Critical": "text-destructive bg-destructive/10 border-destructive/20",
  "P1 High": "text-[color:var(--streak)] bg-[color:var(--streak)]/10 border-[color:var(--streak)]/25",
  "P2 Medium": "text-[color:var(--warning-foreground)] bg-[color:var(--warning)]/25 border-[color:var(--warning)]/40",
  "P3 Low": "text-muted-foreground bg-secondary border-border",
};

export function TaskItem({ task }: { task: ClientTask }) {
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(task.status === "Done");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const deadline = taskDeadline(task);
  const notifyToday = isTaskDateToday(task.notifyDate);
  const endOverdue = deadline && !isDone && isTaskOverdue(deadline);

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
        className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-border bg-card p-3.5 min-h-[56px] shadow-[var(--shadow-sm)] duration-200 ease-out hover:border-primary/40 hover:bg-secondary/50 active:translate-y-px ${
          isDone ? "opacity-55" : ""
        } ${notifyToday && !isDone ? "border-primary bg-primary/5" : ""}`}
      >
        <button
          onClick={toggleStatus}
          disabled={isPending}
          aria-label={isDone ? "Mark incomplete" : "Mark complete"}
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border-2 transition-colors
            ${
              isDone
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary"
            }`}
        >
          {isDone && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-extrabold ${isDone ? "text-muted-foreground line-through" : ""}`}>
            {task.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-bold text-muted-foreground">
            {task.startDate && (
              <span className="inline-flex items-center gap-1">
                <CalendarRange className="h-3 w-3 shrink-0" />
                Start {formatTaskDate(task.startDate)}
              </span>
            )}
            {deadline && (
              <span className={`inline-flex items-center gap-1 ${endOverdue ? "text-[color:var(--streak)]" : ""}`}>
                End {formatTaskDate(deadline)}
              </span>
            )}
            {task.notifyDate && (
              <span
                className={`inline-flex items-center gap-1 ${notifyToday && !isDone ? "text-primary" : ""}`}
              >
                <Bell className="h-3 w-3 shrink-0" />
                Notify {formatTaskDate(task.notifyDate)}
                {notifyToday && !isDone ? " · today" : ""}
              </span>
            )}
            {task.startTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.startTime}
                {task.endTime ? `–${task.endTime}` : ""}
              </span>
            )}
            {task.category && <span className="truncate">{task.category}</span>}
          </div>
        </div>

        <span
          className={`hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold sm:inline-flex ${
            PRIORITY_TONE[task.priority] || PRIORITY_TONE["P2 Medium"]
          }`}
        >
          <Flag className="h-3 w-3" />
          {task.priority.replace("P0 ", "").replace("P1 ", "").replace("P2 ", "").replace("P3 ", "")}
        </span>
      </div>

      {isModalOpen && <TaskModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} task={task} />}
    </>
  );
}
