"use client";

import { useMemo, useState, useTransition } from "react";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
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
  deleteIitmCourseAction,
  deleteIitmDeadlineAction,
  updateIitmDeadlineStatusAction,
  upsertIitmCourseAction,
  upsertIitmDeadlineAction,
  type ClientIitmCourse,
  type ClientIitmDeadline,
} from "@/app/actions/education.actions";
import {
  IITM_COURSE_STATUSES,
  IITM_DEADLINE_STATUSES,
  IITM_DEADLINE_TYPES,
  type IitmCourseStatus,
  type IitmDeadlineStatus,
  type IitmDeadlineType,
} from "@/lib/education-constants";
import { mutateWithOffline, putLocal, deleteLocal } from "@/lib/offline/mutate";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function dayIST(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function pretty(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  });
}

const COURSE_TONE: Record<IitmCourseStatus, string> = {
  Planned: "bg-secondary text-muted-foreground",
  "In Progress": "bg-sky-500/15 text-sky-300",
  Completed: "bg-emerald-500/15 text-emerald-300",
  Dropped: "bg-red-500/15 text-red-300",
};

export function IitmTracker({
  initialCourses,
  initialDeadlines,
}: {
  initialCourses: ClientIitmCourse[];
  initialDeadlines: ClientIitmDeadline[];
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [deadlines, setDeadlines] = useState(initialDeadlines);
  const [courseOpen, setCourseOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ClientIitmCourse | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: "",
    code: "",
    term: "",
    credits: "4",
    status: "In Progress" as IitmCourseStatus,
    grade: "",
    notes: "",
  });
  const [deadlineForm, setDeadlineForm] = useState({
    courseId: "",
    title: "",
    type: "Assignment" as IitmDeadlineType,
    dueDate: "",
    status: "Todo" as IitmDeadlineStatus,
    score: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const active = courses.filter((c) => c.status === "In Progress");
  const creditsDone = courses.filter((c) => c.status === "Completed").reduce((a, c) => a + c.credits, 0);
  const currentTerm =
    active[0]?.term ||
    [...courses].sort((a, b) => b.term.localeCompare(a.term))[0]?.term ||
    "—";

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const weekEndDate = new Date(`${today}T12:00:00+05:30`);
  weekEndDate.setDate(weekEndDate.getDate() + 7);
  const weekEnd = weekEndDate.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const dueThisWeek = deadlines.filter((d) => {
    if (d.status !== "Todo") return false;
    const day = dayIST(d.dueDate);
    return day >= today && day <= weekEnd;
  });
  const overdue = deadlines.filter((d) => d.status === "Todo" && dayIST(d.dueDate) < today);

  const courseName = useMemo(() => {
    const m: Record<string, string> = {};
    courses.forEach((c) => {
      m[c._id] = c.code ? `${c.code} · ${c.title}` : c.title;
    });
    return m;
  }, [courses]);

  function openAddCourse() {
    setEditingCourse(null);
    setCourseForm({
      title: "",
      code: "",
      term: currentTerm === "—" ? "" : currentTerm,
      credits: "4",
      status: "In Progress",
      grade: "",
      notes: "",
    });
    setError(null);
    setCourseOpen(true);
  }

  function openEditCourse(c: ClientIitmCourse) {
    setEditingCourse(c);
    setCourseForm({
      title: c.title,
      code: c.code,
      term: c.term,
      credits: String(c.credits),
      status: c.status,
      grade: c.grade,
      notes: c.notes,
    });
    setError(null);
    setCourseOpen(true);
  }

  function saveCourse() {
    startTransition(async () => {
      const payload = {
        id: editingCourse?._id,
        ...courseForm,
        credits: Number(courseForm.credits),
      };
      const { result: res, offline } = await mutateWithOffline({
        action: "upsertIitmCourse",
        payload,
        onlineFn: () => upsertIitmCourseAction(payload),
        offlineApply: async () => {
          const row: ClientIitmCourse = {
            _id: editingCourse?._id || crypto.randomUUID(),
            title: courseForm.title,
            code: courseForm.code,
            term: courseForm.term,
            credits: Number(courseForm.credits),
            status: courseForm.status,
            grade: courseForm.grade,
            notes: courseForm.notes,
          };
          await putLocal("iitmCourses", row);
          setCourses((prev) => {
            const idx = prev.findIndex((c) => c._id === row._id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = row;
              return next;
            }
            return [row, ...prev];
          });
        },
      });
      if (!offline && res && !(res as any).success) {
        setError((res as any).message || "Could not save");
        return;
      }
      setCourseOpen(false);
      if (!offline) window.location.reload();
    });
  }

  function saveDeadline() {
    startTransition(async () => {
      const { result: res, offline } = await mutateWithOffline({
        action: "upsertIitmDeadline",
        payload: deadlineForm,
        onlineFn: () => upsertIitmDeadlineAction(deadlineForm),
        offlineApply: async () => {
          const row: ClientIitmDeadline = {
            _id: crypto.randomUUID(),
            courseId: deadlineForm.courseId,
            title: deadlineForm.title,
            type: deadlineForm.type,
            dueDate: deadlineForm.dueDate
              ? new Date(deadlineForm.dueDate).toISOString()
              : new Date().toISOString(),
            status: deadlineForm.status,
            score: deadlineForm.score || "",
            notes: deadlineForm.notes || "",
          };
          await putLocal("iitmDeadlines", row);
          setDeadlines((prev) => {
            const idx = prev.findIndex((d) => d._id === row._id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = row;
              return next;
            }
            return [row, ...prev];
          });
        },
      });
      if (!offline && res && !(res as any).success) {
        setError((res as any).message || "Could not save");
        return;
      }
      setDeadlineOpen(false);
      if (!offline) window.location.reload();
    });
  }

  function setDlStatus(id: string, status: IitmDeadlineStatus) {
    setDeadlines((prev) => prev.map((d) => (d._id === id ? { ...d, status } : d)));
    startTransition(async () => {
      await mutateWithOffline({
        action: "updateIitmDeadlineStatus",
        payload: { id, status },
        onlineFn: () => updateIitmDeadlineStatusAction(id, status),
        offlineApply: async () => {
          const row = deadlines.find((d) => d._id === id);
          if (row) await putLocal("iitmDeadlines", { ...row, status });
        },
      });
    });
  }

  function removeCourse(id: string) {
    if (!confirm("Delete this course and its deadlines?")) return;
    setCourses((prev) => prev.filter((c) => c._id !== id));
    setDeadlines((prev) => prev.filter((d) => d.courseId !== id));
    startTransition(async () => {
      await mutateWithOffline({
        action: "deleteIitmCourse",
        payload: { id },
        onlineFn: () => deleteIitmCourseAction(id),
        offlineApply: async () => {
          await deleteLocal("iitmCourses", id);
        },
      });
    });
  }

  function removeDeadline(id: string) {
    setDeadlines((prev) => prev.filter((d) => d._id !== id));
    startTransition(async () => {
      await mutateWithOffline({
        action: "deleteIitmDeadline",
        payload: { id },
        onlineFn: () => deleteIitmDeadlineAction(id),
        offlineApply: async () => {
          await deleteLocal("iitmDeadlines", id);
        },
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Current term" value={currentTerm} />
        <Stat label="Active courses" value={active.length} />
        <Stat label="Due this week" value={dueThisWeek.length} tone="text-amber-400" />
        <Stat label="Credits done" value={creditsDone} tone="text-emerald-400" />
      </div>

      {overdue.length > 0 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-destructive mb-2">{overdue.length} overdue</p>
          <ul className="space-y-1 text-sm">
            {overdue.map((d) => (
              <li key={d._id} className="flex justify-between gap-2">
                <span className="truncate">{d.title} · {courseName[d.courseId]}</span>
                <span className="shrink-0 text-muted-foreground">{pretty(d.dueDate)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setDeadlineForm({
              courseId: courses[0]?._id || "",
              title: "",
              type: "Assignment",
              dueDate: today,
              status: "Todo",
              score: "",
              notes: "",
            });
            setError(null);
            setDeadlineOpen(true);
          }}
          disabled={courses.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add deadline
        </Button>
        <Button onClick={openAddCourse}>
          <Plus className="w-4 h-4 mr-2" />
          Add course
        </Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No IITM courses yet"
          hint="Add this term’s courses, then attach assignments, quizzes, and exams."
        />
      ) : (
        <div className="space-y-4">
          {courses.map((c) => {
            const items = deadlines.filter((d) => d.courseId === c._id);
            return (
              <Card key={c._id}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{c.title}</p>
                        {c.code && <span className="text-xs text-muted-foreground">{c.code}</span>}
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${COURSE_TONE[c.status]}`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.term} · {c.credits} credits{c.grade ? ` · Grade ${c.grade}` : ""}
                      </p>
                      {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditCourse(c)}>
                        Edit
                      </Button>
                      <button onClick={() => removeCourse(c._id)} className="p-2 rounded-lg hover:bg-secondary text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No deadlines on this course.</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((d) => {
                        const late = d.status === "Todo" && dayIST(d.dueDate) < today;
                        return (
                          <div
                            key={d._id}
                            className={`flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-border p-3 ${late ? "bg-destructive/5" : "bg-secondary/40"}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{d.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {d.type} · due {pretty(d.dueDate)}
                                {d.score ? ` · ${d.score}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={d.status}
                                disabled={isPending}
                                onChange={(e) => setDlStatus(d._id, e.target.value as IitmDeadlineStatus)}
                                className="h-8 rounded-lg border border-border bg-transparent px-2 text-xs"
                              >
                                {IITM_DEADLINE_STATUSES.map((s) => (
                                  <option key={s} value={s} className="bg-card">{s}</option>
                                ))}
                              </select>
                              <button onClick={() => removeDeadline(d._id)} className="p-1.5 text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={courseOpen} onOpenChange={setCourseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit course" : "New IITM course"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Title</span>
              <Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="rounded-xl" placeholder="Mathematics for Data Science I" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Code</span>
              <Input value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} className="rounded-xl" placeholder="BSMA1001" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Term</span>
              <Input value={courseForm.term} onChange={(e) => setCourseForm({ ...courseForm, term: e.target.value })} className="rounded-xl" placeholder="Sep 2026" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Credits</span>
              <Input type="number" min={1} value={courseForm.credits} onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Status</span>
              <select value={courseForm.status} onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value as IitmCourseStatus })} className={selectClass}>
                {IITM_COURSE_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-card">{s}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Grade</span>
              <Input value={courseForm.grade} onChange={(e) => setCourseForm({ ...courseForm, grade: e.target.value })} className="rounded-xl" placeholder="S / A / B…" />
            </label>
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Notes</span>
              <textarea value={courseForm.notes} onChange={(e) => setCourseForm({ ...courseForm, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm" />
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseOpen(false)}>Cancel</Button>
            <Button onClick={saveCourse} disabled={isPending}>{isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deadlineOpen} onOpenChange={setDeadlineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New deadline</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Course</span>
              <select value={deadlineForm.courseId} onChange={(e) => setDeadlineForm({ ...deadlineForm, courseId: e.target.value })} className={selectClass}>
                {courses.map((c) => (
                  <option key={c._id} value={c._id} className="bg-card">{c.title}</option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Title</span>
              <Input value={deadlineForm.title} onChange={(e) => setDeadlineForm({ ...deadlineForm, title: e.target.value })} className="rounded-xl" placeholder="Week 3 graded assignment" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Type</span>
              <select value={deadlineForm.type} onChange={(e) => setDeadlineForm({ ...deadlineForm, type: e.target.value as IitmDeadlineType })} className={selectClass}>
                {IITM_DEADLINE_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-card">{t}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Due date</span>
              <Input type="date" value={deadlineForm.dueDate} onChange={(e) => setDeadlineForm({ ...deadlineForm, dueDate: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Status</span>
              <select value={deadlineForm.status} onChange={(e) => setDeadlineForm({ ...deadlineForm, status: e.target.value as IitmDeadlineStatus })} className={selectClass}>
                {IITM_DEADLINE_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-card">{s}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Score</span>
              <Input value={deadlineForm.score} onChange={(e) => setDeadlineForm({ ...deadlineForm, score: e.target.value })} className="rounded-xl" />
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeadlineOpen(false)}>Cancel</Button>
            <Button onClick={saveDeadline} disabled={isPending}>{isPending ? "Saving…" : "Save"}</Button>
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
        <p className={`text-2xl font-semibold mt-1 truncate ${tone || ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
