"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTaskAction, updateTaskAction, deleteTaskAction } from "@/app/actions/task.actions";
import { ITask } from "@/models/Task";
import { mutateWithOffline, putLocal, deleteLocal } from "@/lib/offline/mutate";
import { parseDateInput, toDateInputValue } from "@/lib/task-dates";

export interface TaskModalProps {
  task?: any;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  /** Defaults applied when creating a new task */
  defaults?: {
    isMustDo?: boolean;
    endDate?: string;
    startDate?: string;
  };
}

export function TaskModal({ task, isOpen = false, onOpenChange, trigger, defaults }: TaskModalProps) {
  const isEditing = !!task;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notifyDate, setNotifyDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState("P2 Medium");
  const [tier, setTier] = useState("Tier 3");
  const [category, setCategory] = useState("General");
  const [energy, setEnergy] = useState("Medium");
  const [status, setStatus] = useState("Inbox");
  const [isMustDo, setIsMustDo] = useState(false);
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [internalOpen, setInternalOpen] = useState(isOpen);

  useEffect(() => {
    setInternalOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (internalOpen) {
      if (isEditing && task) {
        setTitle(task.title || "");
        setDescription(task.description || "");
        setStartDate(toDateInputValue(task.startDate));
        setEndDate(toDateInputValue(task.endDate || task.dueDate));
        setNotifyDate(toDateInputValue(task.notifyDate));
        setStartTime(task.startTime || "");
        setEndTime(task.endTime || "");
        setPriority(task.priority || "P2 Medium");
        setTier(task.tier || "Tier 3");
        setCategory(task.category || "General");
        setEnergy(task.energy || "Medium");
        setStatus(task.status || "Inbox");
        setIsMustDo(task.isMustDo || false);
        setTags(task.tags ? task.tags.join(", ") : "");
        setNotes(task.notes || "");
      } else {
        const today = toDateInputValue(new Date().toISOString());
        setTitle("");
        setDescription("");
        setStartDate(defaults?.startDate || today);
        setEndDate(defaults?.endDate || today);
        setNotifyDate("");
        setStartTime("");
        setEndTime("");
        setPriority("P2 Medium");
        setTier("Tier 3");
        setCategory("General");
        setEnergy("Medium");
        setStatus("Inbox");
        setIsMustDo(Boolean(defaults?.isMustDo));
        setTags("");
        setNotes("");
      }
      setError(null);
      setConflictWarning(null);
    }
  }, [internalOpen, task, isEditing, defaults?.isMustDo, defaults?.endDate, defaults?.startDate]);

  const handleSubmit = async (e: React.FormEvent, override = false) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsedStart = parseDateInput(startDate);
    const parsedEnd = parseDateInput(endDate);
    const parsedNotify = parseDateInput(notifyDate);

    const formData = {
      title,
      description,
      startDate: parsedStart,
      endDate: parsedEnd,
      notifyDate: parsedNotify,
      dueDate: parsedEnd ?? parsedStart,
      startTime,
      endTime,
      priority,
      tier,
      category,
      energy,
      status,
      isMustDo,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      notes,
      overrideScheduleConflict: override,
    } as Partial<ITask>;

    try {
      if (isEditing && task._id) {
        const { result: res, offline } = await mutateWithOffline({
          action: "updateTask",
          payload: { taskId: task._id.toString(), data: formData },
          onlineFn: () => updateTaskAction(task._id.toString(), formData),
          offlineApply: async () => {
            await putLocal("tasks", {
              ...task,
              ...formData,
              startDate: parsedStart?.toISOString() ?? null,
              endDate: parsedEnd?.toISOString() ?? null,
              notifyDate: parsedNotify?.toISOString() ?? null,
              dueDate: (parsedEnd ?? parsedStart)?.toISOString() ?? null,
              _id: task._id,
            });
          },
        });
        if (!offline && res && !(res as any).success) {
          const r = res as any;
          if (r.error === "SCHEDULE_CONFLICT") setConflictWarning(r.message as string);
          else setError(r.message as string);
          return;
        }
      } else {
        const tempId = crypto.randomUUID();
        const { result: res, offline } = await mutateWithOffline({
          action: "createTask",
          payload: formData,
          onlineFn: () => createTaskAction(formData),
          offlineApply: async () => {
            await putLocal("tasks", {
              _id: tempId,
              title,
              description,
              startDate: parsedStart?.toISOString() ?? null,
              endDate: parsedEnd?.toISOString() ?? null,
              notifyDate: parsedNotify?.toISOString() ?? null,
              dueDate: (parsedEnd ?? parsedStart)?.toISOString() ?? null,
              startTime,
              endTime,
              priority,
              tier,
              category,
              energy,
              status,
              isMustDo,
              tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
              notes,
              estimatedMinutes: null,
              project: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          },
        });
        if (!offline && res && !(res as any).success) {
          const r = res as any;
          if (r.error === "SCHEDULE_CONFLICT") setConflictWarning(r.message as string);
          else setError(r.message as string);
          return;
        }
      }
      setInternalOpen(false);
      onOpenChange?.(false);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task?._id) return;
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    setLoading(true);
    try {
      await mutateWithOffline({
        action: "deleteTask",
        payload: { taskId: task._id.toString() },
        onlineFn: () => deleteTaskAction(task._id.toString()),
        offlineApply: async () => {
          await deleteLocal("tasks", task._id.toString());
        },
      });
      setInternalOpen(false);
      onOpenChange?.(false);
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setInternalOpen(open);
    onOpenChange?.(open);
  };

  return (
    <Dialog open={internalOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="lg:max-w-[600px] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Add Task"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your task details." : "Create a new task in Tanmay OS."}
          </DialogDescription>
        </DialogHeader>

        {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md mb-4">{error}</div>}
        
        {conflictWarning ? (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-4">
            <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">{conflictWarning}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConflictWarning(null)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="default" onClick={(e) => handleSubmit(e, true)} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                {loading ? "Saving..." : "Override & Save"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Title *</label>
                <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., Complete AWS certification prep" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Start date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notify date</label>
                <Input type="date" value={notifyDate} onChange={(e) => setNotifyDate(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">When you want a reminder for this task.</p>
              </div>

              <div className="space-y-2 flex flex-row items-center justify-between border rounded-md p-2">
                <span className="text-sm font-medium">MUST DO Task</span>
                <input type="checkbox" checked={isMustDo} onChange={e => setIsMustDo(e.target.checked)} className="w-4 h-4 accent-primary" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time (Optional)</label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Time (Optional)</label>
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <select 
                  value={priority} onChange={e => setPriority(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="P0 Critical">P0 Critical</option>
                  <option value="P1 High">P1 High</option>
                  <option value="P2 Medium">P2 Medium</option>
                  <option value="P3 Low">P3 Low</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select 
                  value={status} onChange={e => setStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="Inbox">Inbox</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select 
                  value={category} onChange={e => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="General">General</option>
                  <option value="Career">Career</option>
                  <option value="Education">Education</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Energy Level</label>
                <select 
                  value={energy} onChange={e => setEnergy(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]"
                  placeholder="Task details..."
                />
              </div>

            </div>
            
            <DialogFooter className="mt-6 sm:justify-between">
              {isEditing ? (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                  Delete
                </Button>
              ) : <div />}
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
