"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  parseDateInput,
  toDateInputValue,
  formatDueLabel,
  formatStartsLabel,
  formatRelativeDay,
} from "@/lib/task-dates";
import { cn } from "@/lib/utils";
import { ChevronDown, Flag, Trash2 } from "lucide-react";

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

function shiftDays(base: string, days: number) {
  const d = parseDateInput(base) || new Date();
  d.setDate(d.getDate() + days);
  return toDateInputValue(d.toISOString());
}

function todayInput() {
  return toDateInputValue(new Date().toISOString());
}

const PRIORITIES = [
  { value: "P0 Critical", short: "P0", tone: "bg-destructive/15 text-destructive" },
  { value: "P1 High", short: "P1", tone: "bg-[color:var(--streak)]/15 text-[color:var(--streak)]" },
  { value: "P2 Medium", short: "P2", tone: "bg-primary/15 text-[color:var(--primary-deep)] dark:text-primary" },
  { value: "P3 Low", short: "P3", tone: "bg-secondary text-muted-foreground" },
] as const;

const fieldClass =
  "h-12 w-full rounded-2xl border-2 border-input bg-card px-3.5 text-base font-semibold outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 sm:h-11 sm:text-sm";

export function TaskModal({ task, isOpen, onOpenChange, trigger, defaults }: TaskModalProps) {
  const router = useRouter();
  const isEditing = !!task;
  const isControlled = typeof isOpen === "boolean";

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? Boolean(isOpen) : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

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
  const [moreOpen, setMoreOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
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
      setMoreOpen(Boolean(task.startTime || task.endTime || task.description || task.notifyDate));
    } else {
      const today = todayInput();
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
      setMoreOpen(false);
    }
    setError(null);
    setConflictWarning(null);
  }, [open, task, isEditing, defaults?.isMustDo, defaults?.endDate, defaults?.startDate]);

  const handleSubmit = async (e: React.FormEvent, override = false) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Add a title first.");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError("Due date can’t be before start date.");
      return;
    }
    setLoading(true);
    setError(null);

    const parsedStart = parseDateInput(startDate);
    const parsedEnd = parseDateInput(endDate);
    const parsedNotify = parseDateInput(notifyDate);

    const formData = {
      title: title.trim(),
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
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
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
              title: title.trim(),
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
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task?._id) return;
    if (!confirm("Delete this task?")) return;

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
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const dueIso = parseDateInput(endDate)?.toISOString();
  const startIso = parseDateInput(startDate)?.toISOString();
  const today = todayInput();
  const tomorrow = shiftDays(today, 1);
  const in3 = shiftDays(today, 3);

  const DateChips = ({
    label,
    hint,
    value,
    onChange,
  }: {
    label: string;
    hint?: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p>
        {hint && <p className="text-xs font-bold text-primary">{hint}</p>}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { key: "today", label: "Today", value: today },
          { key: "tmr", label: "Tomorrow", value: tomorrow },
          { key: "3d", label: "In 3 days", value: in3 },
        ].map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.value)}
            className={cn(
              "rounded-2xl px-1 py-2.5 text-[11px] font-extrabold transition-colors active:scale-95",
              value === p.value ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
        <label
          className={cn(
            "relative flex cursor-pointer items-center justify-center rounded-2xl px-1 py-2.5 text-[11px] font-extrabold active:scale-95",
            value && value !== today && value !== tomorrow && value !== in3
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-foreground"
          )}
        >
          {value && value !== today && value !== tomorrow && value !== in3
            ? formatRelativeDay(parseDateInput(value)?.toISOString())
            : "Pick"}
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="flex max-h-[min(92dvh,calc(100dvh-5.5rem))] flex-col gap-0 overflow-hidden p-0 lg:max-w-[420px]">
        <div className="lg:hidden flex justify-center pt-2.5 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-border" />
        </div>

        <DialogHeader className="shrink-0 px-5 pt-3 pb-2 text-left sm:px-6 sm:pt-5">
          <DialogTitle className="pr-8">{isEditing ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? "Update task details" : "Create a new task"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mx-5 mb-2 shrink-0 rounded-2xl bg-destructive/10 px-3 py-2.5 text-sm font-semibold text-destructive sm:mx-6">
            {error}
          </div>
        )}

        {conflictWarning ? (
          <div className="mx-5 mb-4 space-y-3 rounded-2xl bg-[color:var(--warning)]/15 px-4 py-3 sm:mx-6">
            <p className="text-sm font-bold text-[color:var(--warning-foreground)]">{conflictWarning}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setConflictWarning(null)} disabled={loading}>
                Back
              </Button>
              <Button type="button" className="flex-1" onClick={(e) => handleSubmit(e, true)} disabled={loading}>
                {loading ? "Saving…" : "Save anyway"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-3 sm:px-6">
              <div>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What do you need to do?"
                  className="h-14 border-0 bg-secondary/60 text-lg font-extrabold shadow-none focus-visible:ring-primary/30 sm:h-12 sm:text-base"
                />
              </div>

              <DateChips
                label="Starts"
                hint={startIso ? formatStartsLabel(startIso) : undefined}
                value={startDate}
                onChange={(v) => {
                  setStartDate(v);
                  // Due must stay >= start
                  if (endDate && endDate < v) setEndDate(v);
                  setError(null);
                }}
              />

              <DateChips
                label="Due"
                hint={dueIso ? formatDueLabel(dueIso) : undefined}
                value={endDate}
                onChange={(v) => {
                  if (startDate && v < startDate) {
                    setEndDate(startDate);
                    setError("Due date can’t be before start — set to start date.");
                    return;
                  }
                  setEndDate(v);
                  setError(null);
                }}
              />

              <button
                type="button"
                onClick={() => setIsMustDo((v) => !v)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-colors active:scale-[0.99]",
                  isMustDo ? "bg-primary text-primary-foreground" : "bg-secondary"
                )}
              >
                <div>
                  <p className="text-sm font-extrabold">Must do</p>
                  <p className={cn("text-[11px] font-semibold", isMustDo ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    Top priority for today
                  </p>
                </div>
                <span
                  className={cn(
                    "flex h-7 w-12 items-center rounded-full px-0.5 transition-colors",
                    isMustDo ? "bg-primary-foreground/25" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "h-6 w-6 rounded-full bg-card shadow-sm transition-transform",
                      isMustDo && "translate-x-5"
                    )}
                  />
                </span>
              </button>

              <div className="space-y-2">
                <p className="flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  <Flag className="h-3 w-3" /> Priority
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "rounded-2xl py-2.5 text-xs font-extrabold active:scale-95",
                        priority === p.value ? "bg-foreground text-background" : p.tone
                      )}
                    >
                      {p.short}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-2xl bg-secondary/50 px-3 py-2.5 text-sm font-bold text-muted-foreground"
                >
                  More options
                  <ChevronDown className={cn("h-4 w-4 transition-transform", moreOpen && "rotate-180")} />
                </button>

                {moreOpen && (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground">Remind</label>
                        <Input type="date" value={notifyDate} onChange={(e) => setNotifyDate(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground">From</label>
                        <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[11px] font-bold text-muted-foreground">To</label>
                        <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
                          <option value="Inbox">Inbox</option>
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Done">Done</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
                          <option value="General">General</option>
                          <option value="Career">Career</option>
                          <option value="Education">Education</option>
                          <option value="Personal">Personal</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground">Notes</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Optional details…"
                        className="w-full rounded-2xl border-2 border-input bg-card px-3.5 py-3 text-base font-semibold outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 sm:text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t border-border/50 bg-card px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-5">
              {isEditing ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="text-muted-foreground">
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={loading || !title.trim()} className="min-w-[8.5rem] flex-1 sm:flex-none">
                {loading ? "Saving…" : isEditing ? "Save" : "Add task"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
