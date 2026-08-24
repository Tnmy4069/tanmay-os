"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createScheduleBlockAction, updateScheduleBlockAction, deleteScheduleBlockAction } from "@/app/actions/schedule.actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TYPES = ["Fixed", "Focus", "Work", "Commute", "Sleep", "Fitness", "Personal", "Relationship", "Free"];

const TYPE_COLORS: Record<string, string> = {
  Fixed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  Focus: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Work: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Commute: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Sleep: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Fitness: "bg-green-500/10 text-green-400 border-green-500/20",
  Personal: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Relationship: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Free: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

type Block = {
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

export function RoutineEditor({ initialBlocks }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedDay, setSelectedDay] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dayBlocks = blocks
    .filter((b) => b.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  function openAdd() {
    setForm({ ...emptyForm, dayOfWeek: selectedDay });
    setEditingId(null);
    setError(null);
    setShowForm(true);
  }

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
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError(null);
  }

  function handleSave() {
    if (!form.title || !form.startTime || !form.endTime) {
      setError("Title, Start Time, and End Time are required.");
      return;
    }
    if (form.startTime >= form.endTime) {
      setError("End time must be after start time.");
      return;
    }

    setError(null);
    startTransition(async () => {
      let res;
      if (editingId) {
        res = await updateScheduleBlockAction(editingId, form);
      } else {
        res = await createScheduleBlockAction(form);
      }

      if (!res.success) {
        setError(res.message as string);
        return;
      }

      // Optimistic update
      if (editingId) {
        setBlocks((prev) =>
          prev.map((b) => (b._id === editingId ? { ...b, ...form } : b))
        );
      } else {
        // Refresh will happen via revalidatePath; just close for now
        // In a real app you'd refresh router or re-fetch
        window.location.reload();
      }
      closeForm();
    });
  }

  function handleDelete(blockId: string) {
    if (!confirm("Delete this block?")) return;
    startTransition(async () => {
      await deleteScheduleBlockAction(blockId);
      setBlocks((prev) => prev.filter((b) => b._id !== blockId));
    });
  }

  return (
    <div className="space-y-6">
      {/* Day selector */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl overflow-x-auto">
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => { setSelectedDay(i); closeForm(); }}
            className={`flex-1 min-w-[60px] py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              selectedDay === i
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{DAY_ABBR[i]}</span>
          </button>
        ))}
      </div>

      {/* Block list */}
      <div className="space-y-2">
        {dayBlocks.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-xl text-muted-foreground gap-2">
            <p className="text-sm">No blocks on {DAYS[selectedDay]}.</p>
            <p className="text-xs opacity-60">Click "Add Block" to define your schedule.</p>
          </div>
        )}
        {dayBlocks.map((block) => (
          <div
            key={block._id}
            className="flex items-center gap-3 p-3 bg-card border rounded-lg group hover:border-primary/30 transition-all"
          >
            <div className="flex-shrink-0 text-right w-28">
              <span className="text-sm font-mono font-semibold text-foreground">{block.startTime}</span>
              <span className="text-xs text-muted-foreground block">→ {block.endTime}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{block.title}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border mt-0.5 ${TYPE_COLORS[block.type] || "bg-secondary text-secondary-foreground border-border"}`}>
                {block.type}
              </span>
            </div>
            {block.isFixed && (
              <span className="text-xs text-destructive/70 font-medium hidden group-hover:inline">FIXED</span>
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEdit(block)}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(block._id)}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add block button */}
      {!showForm && (
        <Button onClick={openAdd} variant="outline" className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-2" />
          Add Block to {DAYS[selectedDay]}
        </Button>
      )}

      {/* Inline form */}
      {showForm && (
        <div className="border border-primary/30 rounded-xl p-5 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{editingId ? "Edit Block" : `New Block — ${DAYS[selectedDay]}`}</h3>
            <button onClick={closeForm} className="p-1 rounded-md hover:bg-accent text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Morning Focus Block"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Time</label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">End Time</label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Day</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3 border rounded-md px-3 py-2">
              <input
                type="checkbox"
                id="isFixed"
                checked={form.isFixed}
                onChange={(e) => setForm((f) => ({ ...f, isFixed: e.target.checked }))}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="isFixed" className="text-sm font-medium cursor-pointer">
                Fixed block (cannot be overridden by tasks)
              </label>
            </div>

            <div className="flex items-center gap-3 border rounded-md px-3 py-2">
              <input
                type="checkbox"
                id="allowOverride"
                checked={form.allowOverride}
                onChange={(e) => setForm((f) => ({ ...f, allowOverride: e.target.checked }))}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="allowOverride" className="text-sm font-medium cursor-pointer">
                Allow override (tasks can be scheduled here)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeForm} disabled={isPending}>Cancel</Button>
            <Button onClick={handleSave} disabled={isPending}>
              <Check className="w-4 h-4 mr-2" />
              {isPending ? "Saving..." : editingId ? "Update Block" : "Add Block"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
