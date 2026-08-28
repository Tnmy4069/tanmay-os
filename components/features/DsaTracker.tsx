"use client";

import { useMemo, useState, useTransition } from "react";
import { Code2, ExternalLink, Plus, Trash2 } from "lucide-react";
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
import { deleteDsaAction, upsertDsaAction, type ClientDsa } from "@/app/actions/career.actions";
import { DSA_PLATFORMS, DSA_TOPICS } from "@/lib/career-constants";
import { mutateWithOffline, putLocal, deleteLocal } from "@/lib/offline/mutate";
import { useRegisterMobileFab } from "@/lib/mobile-fab-context";

const DIFF_TONE = {
  Easy: "text-emerald-400 bg-emerald-500/10",
  Medium: "text-amber-400 bg-amber-500/10",
  Hard: "text-red-400 bg-red-500/10",
};

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function dateKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function computeStreak(items: ClientDsa[]) {
  const days = new Set(items.filter((p) => p.status === "Solved").map((p) => dateKey(p.solvedAt)));
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  let cursor = today;
  let streak = 0;
  if (!days.has(today)) {
    const d = new Date(`${today}T12:00:00+05:30`);
    d.setDate(d.getDate() - 1);
    cursor = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  }
  while (days.has(cursor) && streak < 400) {
    streak++;
    const d = new Date(`${cursor}T12:00:00+05:30`);
    d.setDate(d.getDate() - 1);
    cursor = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  }
  return streak;
}

const emptyForm = {
  title: "",
  url: "",
  platform: "LeetCode",
  topic: "Arrays",
  difficulty: "Medium" as "Easy" | "Medium" | "Hard",
  status: "Solved" as "Solved" | "Attempted" | "Revisit",
  minutes: "",
  notes: "",
  solvedAt: "",
};

export function DsaTracker({ initialItems }: { initialItems: ClientDsa[] }) {
  const [items, setItems] = useState(initialItems);
  const [topic, setTopic] = useState("All");
  const [diff, setDiff] = useState("All");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const solved = items.filter((p) => p.status === "Solved");
  const streak = computeStreak(items);
  const byDiff = {
    Easy: solved.filter((p) => p.difficulty === "Easy").length,
    Medium: solved.filter((p) => p.difficulty === "Medium").length,
    Hard: solved.filter((p) => p.difficulty === "Hard").length,
  };
  const topicCounts = useMemo(() => {
    const m: Record<string, number> = {};
    solved.forEach((p) => {
      m[p.topic] = (m[p.topic] || 0) + 1;
    });
    return m;
  }, [solved]);

  const visible = items.filter((p) => {
    if (topic !== "All" && p.topic !== topic) return false;
    if (diff !== "All" && p.difficulty !== diff) return false;
    return true;
  });

  function openAdd() {
    setForm({
      ...emptyForm,
      solvedAt: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
    });
    setError(null);
    setOpen(true);
  }

  useRegisterMobileFab({
    label: "Add DSA Problem",
    onAction: openAdd,
  });

  function save() {
    startTransition(async () => {
      const payload = {
        ...form,
        minutes: form.minutes ? Number(form.minutes) : undefined,
      };
      const { result: res, offline } = await mutateWithOffline({
        action: "upsertDsa",
        payload,
        onlineFn: () => upsertDsaAction(payload),
        offlineApply: async () => {
          const row: ClientDsa = {
            _id: crypto.randomUUID(),
            title: form.title,
            url: form.url,
            platform: form.platform,
            topic: form.topic,
            difficulty: form.difficulty,
            status: form.status,
            minutes: form.minutes ? Number(form.minutes) : 0,
            notes: form.notes,
            solvedAt: form.solvedAt
              ? new Date(form.solvedAt).toISOString()
              : new Date().toISOString(),
          };
          await putLocal("dsa", row);
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
    if (!confirm("Delete this problem log?")) return;
    setItems((prev) => prev.filter((p) => p._id !== id));
    startTransition(async () => {
      await mutateWithOffline({
        action: "deleteDsa",
        payload: { id },
        onlineFn: () => deleteDsaAction(id),
        offlineApply: async () => {
          await deleteLocal("dsa", id);
        },
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Solved" value={solved.length} />
        <Stat label="Easy / Med / Hard" value={`${byDiff.Easy} · ${byDiff.Medium} · ${byDiff.Hard}`} />
        <Stat label="Revisit" value={items.filter((p) => p.status === "Revisit").length} tone="text-amber-400" />
        <Stat label="Solve streak" value={`${streak}d`} tone="text-primary" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {DSA_TOPICS.map((t) => (
          <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
            {t} {topicCounts[t] ? `· ${topicCounts[t]}` : ""}
          </span>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className={selectClass + " w-auto"}>
            <option value="All" className="bg-card">All topics</option>
            {DSA_TOPICS.map((t) => (
              <option key={t} value={t} className="bg-card">{t}</option>
            ))}
          </select>
          <select value={diff} onChange={(e) => setDiff(e.target.value)} className={selectClass + " w-auto"}>
            <option value="All" className="bg-card">All difficulty</option>
            <option value="Easy" className="bg-card">Easy</option>
            <option value="Medium" className="bg-card">Medium</option>
            <option value="Hard" className="bg-card">Hard</option>
          </select>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Log problem
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Code2} title="No problems logged" hint="Log what you solved today. Streak counts consecutive solve days." />
      ) : (
        <div className="space-y-2">
          {visible.map((p) => (
            <div key={p._id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium truncate">{p.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${DIFF_TONE[p.difficulty]}`}>{p.difficulty}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{p.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.topic} · {p.platform} · {new Date(p.solvedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                  {p.minutes ? ` · ${p.minutes}m` : ""}
                </p>
                {p.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.notes}</p>}
              </div>
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-secondary">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button onClick={() => remove(p._id)} className="p-2 rounded-lg hover:bg-secondary text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a problem</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Title</span>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" placeholder="Two Sum" />
            </label>
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">URL</span>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Platform</span>
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={selectClass}>
                {DSA_PLATFORMS.map((p) => (
                  <option key={p} value={p} className="bg-card">{p}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Topic</span>
              <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className={selectClass}>
                {DSA_TOPICS.map((t) => (
                  <option key={t} value={t} className="bg-card">{t}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Difficulty</span>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })} className={selectClass}>
                <option className="bg-card">Easy</option>
                <option className="bg-card">Medium</option>
                <option className="bg-card">Hard</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className={selectClass}>
                <option className="bg-card">Solved</option>
                <option className="bg-card">Attempted</option>
                <option className="bg-card">Revisit</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Minutes</span>
              <Input type="number" min={0} value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Date</span>
              <Input type="date" value={form.solvedAt} onChange={(e) => setForm({ ...form, solvedAt: e.target.value })} className="rounded-xl" />
            </label>
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Notes / pattern</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="Two pointers, sliding window…"
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
