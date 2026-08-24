"use client";

import { useState, useTransition } from "react";
import { Check, Clock, Edit2 } from "lucide-react";
import { toggleTaskStatusAction } from "@/app/actions/task.actions";
import { TaskModal } from "./TaskModal";

export function TaskItem({ task }: { task: any }) {
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(task.status === "Done");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = isDone ? "Todo" : "Done";
    setIsDone(!isDone); // Optimistic update
    
    startTransition(async () => {
      try {
        await toggleTaskStatusAction(task._id.toString(), newStatus);
      } catch (err) {
        // Revert on error
        setIsDone(isDone);
      }
    });
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group ${isDone ? 'opacity-60 bg-muted/50' : 'bg-card'}`}
      >
        <button 
          onClick={toggleStatus}
          disabled={isPending}
          className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors
            ${isDone ? 'bg-primary border-primary text-primary-foreground' : 'border-input hover:border-primary'}`}
        >
          {isDone && <Check className="w-3.5 h-3.5" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm truncate ${isDone ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </p>
          {(task.startTime || task.category) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              {task.startTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.startTime} {task.endTime ? `- ${task.endTime}` : ''}
                </span>
              )}
              {task.category && (
                <span className="truncate">{task.category}</span>
              )}
            </div>
          )}
        </div>

        <button 
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-accent rounded-md transition-opacity"
          aria-label="Edit task"
        >
          <Edit2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {isModalOpen && (
        <TaskModal 
          isOpen={isModalOpen} 
          onOpenChange={setIsModalOpen} 
          task={task} 
        />
      )}
    </>
  );
}
