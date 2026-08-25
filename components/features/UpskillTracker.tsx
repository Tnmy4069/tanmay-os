"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Lightbulb, Plus, Timer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/layout/EmptyState";
import {
  deleteSkillCourseAction,
  logSkillHoursAction,
  upsertSkillCourseAction,
  type ClientSkillCourse,
} from "@/app/actions/education.actions";
import { SKILL_PLATFORMS, SKILL_STATUSES, type SkillStatus } from "@/lib/education-constants";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const STATUS_TONE: Record<SkillStatus, string> = {
  Planned: "bg-white/5 text-muted-foreground",
  "In Progress": "bg-sky-500/15 text-sky-300",
  Completed: "bg-emerald-500/15 text-emerald-300",
  Paused: "bg-amber-500/15 text-amber-300",
};

export function UpskillTracker({
  initialCourses,
  hoursThisMonth,
}: {
  initialCourses: ClientSkillCourse[];
  hoursThisMonth: number;
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [filter, setFilter] = useState<SkillStatus | "All">("All");
  const [open, setOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<ClientSkillCourse | null>(null);
  const [editing, setEditing] = useState<ClientSkillCourse | null>(null);
  const [form, setForm] = useState({
    title: "",
    platform: "YouTube",
    category: "",
    status: "In Progress" as SkillStatus,
    progress: "0",
    url: "",
    notes: "",
  });
  const [logForm, setLogForm] = useState({ minutes: "45", sessionDate: "", notes: "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visible = filter === "All" ? courses : courses.filter((c) => c.status === filter);
  const active = courses.filter((c) => c.status === "In Progress").length;
  const certs = courses.filter((c) => c.status === "Completed").length;

  function openAdd() {
    setEditing(null);
    setForm({
      title: "",
      platform: "YouTube",
      category: "",
      status: "In Progress",
      progress: "0",
      url: "",
      notes: "",
    });
    setError(null);
    setOpen(true);
  }

  function openEdit(c: ClientSkillCourse) {
    setEditing(c);
    setForm({
      title: c.title,
      platform: c.platform,
      category: c.category,
      status: c.status,
      progress: String(c.progress),
      url: c.url,
      notes: c.notes,
    });
    setError(null);
    setOpen(true);
  }

  function save() {
    startTransition(async () => {
      const res = await upsertSkillCourseAction({
        id: editing?._id,
        ...form,
        progress: Number(form.progress),
      });
      if (!res.success) {
        setError(res.message || "Could not save");
        return;
      }
      setOpen(false);
      window.location.reload();
    });
  }

  function saveLog() {
    if (!logTarget) return;
    startTransition(async () => {
      const res = await logSkillHoursAction(
        logTarget._id,
        Number(logForm.minutes),
        logForm.sessionDate,
        logForm.notes
      );
      if (!res.success) {
        setError(res.message || "Could not log");
        return;
      }
      setLogOpen(false);
      window.location.reload();
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this course and its hour logs?")) return;
    setCourses((prev) => prev.filter((c) => c._id !== id));
    startTransition(async () => {
      await deleteSkillCourseAction(id);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Active" value={active} />
        <Stat label="Completed / certs" value={certs} tone="text-emerald-400" />
        <Stat label="Hours this month" value={`${Math.round(hoursThisMonth * 10) / 10}h`} tone="text-primary" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(["All", ...SKILL_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                filter === s ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add course
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Nothing here yet"
          hint="Add a cert, tutorial series, or book. Log study minutes so monthly hours stay honest."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {visible.map((c) => (
            <div key={c._id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.platform}
                    {c.category ? ` · ${c.category}` : ""}
                  </p>
                </div>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full shrink-0 ${STATUS_TONE[c.status]}`}>
                  {c.status}
                </span>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{c.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${c.progress}%` }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(c.hoursLogged * 10) / 10}h logged
                {c.lastStudiedAt
                  ? ` · last ${new Date(c.lastStudiedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`
                  : ""}
              </p>
              {c.notes && <p className="text-xs text-muted-foreground line-clamp-2">{c.notes}</p>}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLogTarget(c);
                    setLogForm({
                      minutes: "45",
                      sessionDate: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
                      notes: "",
                    });
                    setError(null);
                    setLogOpen(true);
                  }}
                >
                  <Timer className="w-3.5 h-3.5 mr-1" />
                  Log time
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                  Edit
                </Button>
                {c.url && (
                  <a href={c.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-white/5">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => remove(c._id)} className="ml-auto p-2 rounded-lg hover:bg-white/5 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit course" : "New skill course"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Title</span>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" placeholder="System design primer" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Platform</span>
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={selectClass}>
                {SKILL_PLATFORMS.map((p) => (
                  <option key={p} value={p} className="bg-card">{p}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Category</span>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl" placeholder="Backend, ML…" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SkillStatus })} className={selectClass}>
                {SKILL_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-card">{s}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Progress %</span>
              <Input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} className="rounded-xl" />
            </label>
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">URL</span>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="rounded-xl" />
            </label>
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Notes</span>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm" />
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={isPending}>{isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log time{logTarget ? ` · ${logTarget.title}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Minutes</span>
              <Input type="number" min={1} value={logForm.minutes} onChange={(e) => setLogForm({ ...logForm, minutes: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Date</span>
              <Input type="date" value={logForm.sessionDate} onChange={(e) => setLogForm({ ...logForm, sessionDate: e.target.value })} className="rounded-xl" />
            </label>
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">What did you cover?</span>
              <textarea value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm" />
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogOpen(false)}>Cancel</Button>
            <Button onClick={saveLog} disabled={isPending}>{isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold mt-1 ${tone || ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
