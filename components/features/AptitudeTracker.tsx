"use client";

import { useMemo, useState, useTransition } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
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
import { deleteAptitudeAction, upsertAptitudeAction, type ClientAptitude } from "@/app/actions/career.actions";
import { APTITUDE_CATEGORIES } from "@/lib/career-constants";
import { mutateWithOffline, putLocal, deleteLocal } from "@/lib/offline/mutate";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const emptyForm = {
  category: "Quantitative",
  topic: "",
  attempted: "20",
  correct: "14",
  minutes: "30",
  notes: "",
  sessionDate: "",
};

function startOfWeekIST() {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const d = new Date(`${today}T12:00:00+05:30`);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function AptitudeTracker({ initialItems }: { initialItems: ClientAptitude[] }) {
  const [items, setItems] = useState(initialItems);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const weekStart = startOfWeekIST();
  const thisWeek = items.filter((s) => {
    const day = new Date(s.sessionDate).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return day >= weekStart;
  });

  const totals = useMemo(() => {
    const attempted = items.reduce((a, s) => a + s.attempted, 0);
    const correct = items.reduce((a, s) => a + s.correct, 0);
    const minutes = items.reduce((a, s) => a + (s.minutes || 0), 0);
    return { attempted, correct, minutes, accuracy: attempted ? Math.round((correct / attempted) * 100) : 0 };
  }, [items]);

  const byCat = APTITUDE_CATEGORIES.map((cat) => {
    const rows = items.filter((s) => s.category === cat);
    const attempted = rows.reduce((a, s) => a + s.attempted, 0);
    const correct = rows.reduce((a, s) => a + s.correct, 0);
    const week = thisWeek.filter((s) => s.category === cat).length;
    return { cat, attempted, correct, accuracy: attempted ? Math.round((correct / attempted) * 100) : 0, week };
  });

  function openAdd() {
    setForm({
      ...emptyForm,
      sessionDate: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
    });
    setError(null);
    setOpen(true);
  }

  function save() {
    startTransition(async () => {
      const payload = {
        category: form.category,
        topic: form.topic,
        attempted: Number(form.attempted),
        correct: Number(form.correct),
        minutes: form.minutes ? Number(form.minutes) : undefined,
        notes: form.notes,
        sessionDate: form.sessionDate,
      };
      const { result: res, offline } = await mutateWithOffline({
        action: "upsertAptitude",
        payload,
        onlineFn: () => upsertAptitudeAction(payload),
        offlineApply: async () => {
          const row: ClientAptitude = {
            _id: crypto.randomUUID(),
            category: form.category,
            topic: form.topic,
            attempted: Number(form.attempted),
            correct: Number(form.correct),
            minutes: form.minutes ? Number(form.minutes) : 0,
            notes: form.notes,
            sessionDate: form.sessionDate
              ? new Date(form.sessionDate).toISOString()
              : new Date().toISOString(),
          };
          await putLocal("aptitude", row);
          setItems((prev) => [row, ...prev]);
        },
      });
      if (!offline && res && !(res as any).success) {
        setError((res as any).message || "Could not save");
        return;
      }
      setOpen(false);
      if (!offline) window.location.reload();
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this session?")) return;
    setItems((prev) => prev.filter((s) => s._id !== id));
    startTransition(async () => {
      await mutateWithOffline({
        action: "deleteAptitude",
        payload: { id },
        onlineFn: () => deleteAptitudeAction(id),
        offlineApply: async () => {
          await deleteLocal("aptitude", id);
        },
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Accuracy" value={`${totals.accuracy}%`} tone="text-primary" />
        <Stat label="Questions" value={`${totals.correct}/${totals.attempted || 0}`} />
        <Stat label="Time logged" value={`${Math.round((totals.minutes / 60) * 10) / 10}h`} />
        <Stat label="Sessions this week" value={thisWeek.length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {byCat.map((c) => (
          <Card key={c.cat}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.cat}</p>
              <p className="text-2xl font-semibold mt-1">{c.accuracy}%</p>
              <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${c.accuracy}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {c.correct}/{c.attempted || 0} · {c.week} sessions this week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Log session
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={BookOpen} title="No practice yet" hint="Log quant, logical, and verbal sets with attempted vs correct." />
      ) : (
        <div className="space-y-2">
          {items.map((s) => {
            const acc = s.attempted ? Math.round((s.correct / s.attempted) * 100) : 0;
            return (
              <div key={s._id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{s.category}</p>
                    {s.topic && <span className="text-xs text-muted-foreground">{s.topic}</span>}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary">{acc}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {s.correct}/{s.attempted} correct
                    {s.minutes ? ` · ${s.minutes}m` : ""} ·{" "}
                    {new Date(s.sessionDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </p>
                  {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
                </div>
                <button onClick={() => remove(s._id)} className="p-2 rounded-lg hover:bg-secondary text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log aptitude session</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={selectClass}>
                {APTITUDE_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-card">{c}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Topic</span>
              <Input placeholder="Percentages, puzzles…" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Attempted</span>
              <Input type="number" min={1} value={form.attempted} onChange={(e) => setForm({ ...form, attempted: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Correct</span>
              <Input type="number" min={0} value={form.correct} onChange={(e) => setForm({ ...form, correct: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Minutes</span>
              <Input type="number" min={0} value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Date</span>
              <Input type="date" value={form.sessionDate} onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} className="rounded-xl" />
            </label>
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="Where you lost marks…"
              />
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={isPending}>{isPending ? "Saving…" : "Save"}</Button>
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
