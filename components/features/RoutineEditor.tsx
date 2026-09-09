"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  Zap,
  Briefcase,
  Dumbbell,
  Moon,
  Navigation,
  User,
  Heart,
  Smile,
  Lock,
  Unlock,
  Calendar,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createScheduleBlockAction,
  updateScheduleBlockAction,
  deleteScheduleBlockAction,
  generateRoutineFromTextAction,
} from "@/app/actions/schedule.actions";
import { mutateWithOffline, putLocal, deleteLocal, getLocalAll } from "@/lib/offline/mutate";
import { useOnlineStatus } from "@/lib/offline/hooks";
import { parseTimeToMinutes } from "@/utils/date";
import { useRegisterMobileFab } from "@/lib/mobile-fab-context";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const BLOCK_TYPES = [
  { id: "Focus", label: "Focus", icon: Zap, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30", badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  { id: "Work", label: "Work", icon: Briefcase, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30", badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
  { id: "Fitness", label: "Fitness", icon: Dumbbell, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30", badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { id: "Sleep", label: "Sleep", icon: Moon, color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30", badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  { id: "Commute", label: "Commute", icon: Navigation, color: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30", badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  { id: "Personal", label: "Personal", icon: User, color: "text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/30", badgeColor: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20" },
  { id: "Relationship", label: "Relationship", icon: Heart, color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30", badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  { id: "Free", label: "Free Time", icon: Smile, color: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/30", badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20" },
  { id: "Fixed", label: "Fixed", icon: Lock, color: "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/30", badgeColor: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" },
] as const;

const QUICK_PRESETS = [
  { title: "Deep Focus Block", type: "Focus", startTime: "08:00", endTime: "10:00" },
  { title: "Work Core Hours", type: "Work", startTime: "10:00", endTime: "18:00" },
  { title: "DSA / Upskilling", type: "Focus", startTime: "20:00", endTime: "22:00" },
  { title: "Gym & Workout", type: "Fitness", startTime: "18:30", endTime: "19:30" },
  { title: "Sleep & Wind Down", type: "Sleep", startTime: "23:00", endTime: "07:00" },
];

export type Block = {
  _id: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: string;
  isFixed: boolean;
  allowOverride: boolean;
};

type Props = {
  initialBlocks: Block[];
};

const emptyForm = {
  title: "",
  dayOfWeek: 1,
  startTime: "",
  endTime: "",
  type: "Focus",
  isFixed: true,
  allowOverride: false,
};

function format12Hour(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function calculateDuration(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return "";
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  if (endMin <= startMin) return "";
  const diff = endMin - startMin;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

function calculateDayTotalMinutes(dayBlocks: Block[]): number {
  return dayBlocks.reduce((acc, block) => {
    const start = parseTimeToMinutes(block.startTime);
    const end = parseTimeToMinutes(block.endTime);
    return end > start ? acc + (end - start) : acc;
  }, 0);
}

export function RoutineEditor({ initialBlocks }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // AI State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiPending, startAiTransition] = useTransition();
  
  const online = useOnlineStatus();

  useEffect(() => {
    if (online) {
      setBlocks(initialBlocks);
      return;
    }
    getLocalAll<Block>("schedule").then((rows) => {
      if (rows.length) setBlocks(rows);
    });
  }, [online, initialBlocks]);

  const dayBlocks = useMemo(() => {
    return blocks
      .filter((b) => b.dayOfWeek === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [blocks, selectedDay]);

  const totalDayMinutes = useMemo(() => {
    return calculateDayTotalMinutes(dayBlocks);
  }, [dayBlocks]);

  const dayCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let i = 0; i < 7; i++) counts[i] = 0;
    blocks.forEach((b) => {
      counts[b.dayOfWeek] = (counts[b.dayOfWeek] || 0) + 1;
    });
    return counts;
  }, [blocks]);

  function openAdd() {
    setForm({ ...emptyForm, dayOfWeek: selectedDay });
    setEditingId(null);
    setError(null);
    setIsModalOpen(true);
  }

  useRegisterMobileFab({
    label: `Add Block to ${DAYS[selectedDay]}`,
    onAction: openAdd,
  });

  function openEdit(block: Block) {
    setForm({
      title: block.title,
      dayOfWeek: block.dayOfWeek,
      startTime: block.startTime,
      endTime: block.endTime,
      type: block.type,
      isFixed: block.isFixed,
      allowOverride: block.allowOverride,
    });
    setEditingId(block._id);
    setError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setError(null);
  }

  function handleSave() {
    if (!form.title.trim() || !form.startTime || !form.endTime) {
      setError("Title, Start Time, and End Time are required.");
      return;
    }
    if (form.startTime >= form.endTime) {
      setError("End time must be strictly after start time.");
      return;
    }

    setError(null);
    startTransition(async () => {
      if (editingId) {
        const { result: res, offline } = await mutateWithOffline({
          action: "updateScheduleBlock",
          payload: { blockId: editingId, data: form },
          onlineFn: () => updateScheduleBlockAction(editingId, form),
          offlineApply: async () => {
            await putLocal("schedule", { _id: editingId, ...form });
            setBlocks((prev) => prev.map((b) => (b._id === editingId ? { ...b, ...form } : b)));
          },
        });
        if (!offline && res && !(res as any).success) {
          setError((res as any).message as string);
          return;
        }
        if (!offline) {
          setBlocks((prev) => prev.map((b) => (b._id === editingId ? { ...b, ...form } : b)));
        }
      } else {
        const tempId = crypto.randomUUID();
        const { result: res, offline } = await mutateWithOffline({
          action: "createScheduleBlock",
          payload: form,
          onlineFn: () => createScheduleBlockAction(form),
          offlineApply: async () => {
            const row = { _id: tempId, ...form };
            await putLocal("schedule", row);
            setBlocks((prev) => [...prev, row as any]);
          },
        });
        if (!offline && res && !(res as any).success) {
          setError((res as any).message as string);
          return;
        }
        if (!offline) {
          window.location.reload();
          return;
        }
      }
      closeModal();
    });
  }

  function handleDelete(blockId: string) {
    if (!confirm("Are you sure you want to delete this routine block?")) return;
    startTransition(async () => {
      await mutateWithOffline({
        action: "deleteScheduleBlock",
        payload: { blockId },
        onlineFn: () => deleteScheduleBlockAction(blockId),
        offlineApply: async () => {
          await deleteLocal("schedule", blockId);
        },
      });
      setBlocks((prev) => prev.filter((b) => b._id !== blockId));
      if (editingId === blockId) {
        closeModal();
      }
    });
  }

  function handleAiSubmit() {
    if (!aiPrompt.trim()) return;
    setAiError(null);
    startAiTransition(async () => {
      const res = await generateRoutineFromTextAction(aiPrompt, selectedDay);
      if (!res.success) {
        setAiError(res.message as string);
        return;
      }
      // AI success, reload the page to fetch the new schedule
      window.location.reload();
    });
  }

  const liveDuration = calculateDuration(form.startTime, form.endTime);
  const selectedTypeConfig = BLOCK_TYPES.find((t) => t.id === form.type) || BLOCK_TYPES[0];

  return (
    <div className="space-y-6">
      {/* Day Selector Navigation */}
      <div className="flex gap-1.5 bg-muted/40 p-1.5 rounded-2xl overflow-x-auto scrollbar-none border border-border/40">
        {DAYS.map((day, i) => {
          const isSelected = selectedDay === i;
          const count = dayCounts[i] || 0;
          return (
            <button
              key={day}
              onClick={() => {
                setSelectedDay(i);
              }}
              className={`flex-1 min-w-[72px] py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/60"
              }`}
            >
              <span className="hidden md:inline">{day}</span>
              <span className="md:hidden">{DAY_ABBR[i]}</span>
              {count > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                    isSelected
                      ? "bg-white/25 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Header Info & Quick Add Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              {DAYS[selectedDay]} Schedule
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">
                {dayBlocks.length} {dayBlocks.length === 1 ? "block" : "blocks"}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {totalDayMinutes > 0 ? (
                <>
                  <span className="font-medium text-foreground">
                    {Math.floor(totalDayMinutes / 60)}h {totalDayMinutes % 60 > 0 ? `${totalDayMinutes % 60}m` : ""}
                  </span>{" "}
                  total scheduled routine
                </>
              ) : (
                "No blocks scheduled for this day"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAiModalOpen(true)}
            variant="outline"
            className="rounded-xl shadow-sm hover:shadow-md transition-all gap-2 font-semibold text-primary border-primary/20 hover:bg-primary/5"
          >
            <Sparkles className="w-4 h-4" />
            AI Magic
          </Button>
          <Button
            onClick={openAdd}
            className="rounded-xl shadow-sm hover:shadow-md transition-all gap-2 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Block
          </Button>
        </div>
      </div>

      {/* Block list */}
      <div className="space-y-3">
        {dayBlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border/80 rounded-2xl text-center bg-card/40">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground">No routine blocks for {DAYS[selectedDay]}</h4>
            <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4">
              Add fixed focus times, work blocks, commute, or habits to structure your day.
            </p>
            <Button onClick={openAdd} variant="outline" size="sm" className="rounded-xl border-dashed">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add First Block
            </Button>
          </div>
        ) : (
          dayBlocks.map((block) => {
            const typeConfig = BLOCK_TYPES.find((t) => t.id === block.type) || BLOCK_TYPES[0];
            const TypeIcon = typeConfig.icon;
            const durationStr = calculateDuration(block.startTime, block.endTime);

            return (
              <div
                key={block._id}
                onClick={() => openEdit(block)}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-card hover:bg-accent/20 border-2 border-border hover:border-primary/40 rounded-2xl transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  {/* Type Icon Badge */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${typeConfig.badgeColor}`}
                  >
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  {/* Block Content */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm sm:text-base text-foreground truncate">{block.title}</h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${typeConfig.badgeColor}`}
                      >
                        {block.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      {/* Time Display */}
                      <span className="font-semibold text-foreground font-mono">
                        {format12Hour(block.startTime)} – {format12Hour(block.endTime)}
                      </span>
                      {durationStr && (
                        <>
                          <span className="opacity-40">•</span>
                          <span className="bg-muted px-1.5 py-0.5 rounded font-medium text-[11px]">
                            {durationStr}
                          </span>
                        </>
                      )}
                      <span className="opacity-40">•</span>
                      <span className="text-[11px] font-mono opacity-70">
                        ({block.startTime} - {block.endTime})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side Status & Quick Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  <div className="flex items-center gap-1.5">
                    {block.isFixed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                        <Lock className="w-3 h-3" />
                        Fixed
                      </span>
                    )}
                    {block.allowOverride && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Unlock className="w-3 h-3" />
                        Overrideable
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(block);
                      }}
                      title="Edit Block"
                      className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(block._id);
                      }}
                      title="Delete Block"
                      className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* POPUP MODAL FOR ADD / EDIT BLOCK */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="flex flex-col gap-0 max-lg:gap-0 lg:gap-0 p-0 max-lg:p-0 lg:p-0 max-h-[85vh] lg:max-h-[85vh] w-[calc(100%-1.5rem)] max-w-lg overflow-hidden rounded-2xl sm:rounded-3xl border-2 shadow-2xl">
          {/* Mobile handle indicator */}
          <div className="lg:hidden flex justify-center pt-2.5 pb-1">
            <div className="h-1.5 w-10 rounded-full bg-border" />
          </div>

          {/* Fixed Header */}
          <div className="shrink-0 px-4 py-3.5 sm:px-6 sm:py-4 border-b bg-card/70">
            <DialogHeader className="text-left space-y-0.5">
              <div className="flex items-center gap-2.5 pr-6">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border ${selectedTypeConfig.badgeColor}`}
                >
                  <selectedTypeConfig.icon className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold">
                    {editingId ? "Edit Routine Block" : "Add Routine Block"}
                  </DialogTitle>
                  <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground">
                    Set weekly schedule blocks to protect focus and routines.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Scrollable Body */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Presets (Only in Add mode) */}
            {!editingId && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Quick Presets
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({
                          ...f,
                          title: preset.title,
                          type: preset.type,
                          startTime: preset.startTime,
                          endTime: preset.endTime,
                        }));
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg border bg-muted/40 hover:bg-accent hover:border-primary/30 transition-colors font-medium text-foreground"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Block Title <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Morning Deep Work, DSA Practice..."
                className="h-10 rounded-xl text-sm font-medium border-2"
                autoFocus
              />
            </div>

            {/* Category / Type Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Category / Activity Type
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {BLOCK_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = form.type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                      className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all text-left ${
                        isSelected
                          ? `${t.badgeColor} border-2 shadow-xs scale-[1.02]`
                          : "border-border/70 hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day and Times Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Day of Week */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Day of the Week
                </label>
                <div className="flex gap-1 overflow-x-auto p-1 bg-muted/40 rounded-xl border">
                  {DAYS.map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, dayOfWeek: i }))}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold transition-all ${
                        form.dayOfWeek === i
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {DAY_ABBR[i]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Time */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Start Time <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="h-10 rounded-xl text-sm font-mono font-semibold border-2"
                  />
                  {form.startTime && (
                    <span className="absolute right-3 top-2.5 text-[11px] font-mono text-muted-foreground pointer-events-none">
                      {format12Hour(form.startTime)}
                    </span>
                  )}
                </div>
              </div>

              {/* End Time */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  End Time <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="h-10 rounded-xl text-sm font-mono font-semibold border-2"
                  />
                  {form.endTime && (
                    <span className="absolute right-3 top-2.5 text-[11px] font-mono text-muted-foreground pointer-events-none">
                      {format12Hour(form.endTime)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Calculated Live Duration Banner */}
            {liveDuration && (
              <div className="flex items-center gap-2 p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Duration: {liveDuration}</span>
                <span className="text-muted-foreground font-normal ml-auto text-[11px]">
                  {format12Hour(form.startTime)} → {format12Hour(form.endTime)}
                </span>
              </div>
            )}

            {/* Options Toggles */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Scheduling Rules
              </label>

              <label
                htmlFor="modal-isFixed"
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                  form.isFixed
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/60 hover:border-border"
                }`}
              >
                <input
                  type="checkbox"
                  id="modal-isFixed"
                  checked={form.isFixed}
                  onChange={(e) => setForm((f) => ({ ...f, isFixed: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Lock className="w-3.5 h-3.5 text-destructive" />
                    Fixed Block
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Priority locked. Tasks cannot overlap with this block unless override is allowed.
                  </p>
                </div>
              </label>

              <label
                htmlFor="modal-allowOverride"
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                  form.allowOverride
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/60 hover:border-border"
                }`}
              >
                <input
                  type="checkbox"
                  id="modal-allowOverride"
                  checked={form.allowOverride}
                  onChange={(e) => setForm((f) => ({ ...f, allowOverride: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                    Allow Task Override
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Flexible window. Dynamic tasks can be auto-scheduled within this block.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Fixed Footer Actions */}
          <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 border-t bg-muted/20 flex items-center justify-between gap-2">
            {editingId ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => editingId && handleDelete(editingId)}
                disabled={isPending}
                className="rounded-xl font-semibold gap-1.5 text-xs h-9"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeModal}
                disabled={isPending}
                className="rounded-xl text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isPending}
                className="rounded-xl font-bold min-w-[110px] text-xs h-9"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  "Update Block"
                ) : (
                  "Add Block"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI MAGIC MODAL */}
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl sm:rounded-3xl border-2 p-0 overflow-hidden shadow-2xl gap-0">
          <div className="shrink-0 px-4 py-4 sm:px-6 sm:py-5 border-b bg-primary/5">
            <DialogHeader className="text-left space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">AI Routine Builder</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Describe your day naturally, and AI will create blocks for {DAYS[selectedDay]}.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {aiError && (
              <div className="flex items-start gap-2.5 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Describe your day
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., I wake up at 7am, work out for an hour. Commute at 8:30. Work from 9 to 5 with a break at 1pm. Then DSA prep from 8pm to 10pm."
                className="w-full h-32 p-3 text-sm rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none bg-background"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-primary">Warning:</span> Generating with AI will overwrite any existing blocks for this day.
              </p>
            </div>
          </div>

          <div className="px-4 py-3 sm:px-6 sm:py-4 border-t bg-muted/20 flex justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAiModalOpen(false)}
              disabled={isAiPending}
              className="rounded-xl text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAiSubmit}
              disabled={isAiPending || !aiPrompt.trim()}
              className="rounded-xl font-bold text-xs h-9 min-w-[130px]"
            >
              {isAiPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Generate Blocks
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
