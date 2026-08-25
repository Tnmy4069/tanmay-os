"use client";

import { useMemo, useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Building2 } from "lucide-react";
import {
  deleteJobAction,
  updateJobStatusAction,
  upsertJobAction,
  type ClientJob,
} from "@/app/actions/career.actions";
import { JOB_STATUSES, type JobStatus } from "@/lib/career-constants";

const STATUS_STYLE: Record<JobStatus, string> = {
  Wishlist: "bg-secondary text-muted-foreground",
  Applied: "bg-sky-500/15 text-sky-300",
  OA: "bg-amber-500/15 text-amber-300",
  Interview: "bg-violet-500/15 text-violet-300",
  Offer: "bg-emerald-500/15 text-emerald-300",
  Rejected: "bg-red-500/15 text-red-300",
  Ghosted: "bg-zinc-500/15 text-zinc-400",
};

const emptyForm = {
  company: "",
  role: "",
  location: "",
  jobUrl: "",
  status: "Applied" as JobStatus,
  source: "",
  appliedAt: "",
  nextDate: "",
  salary: "",
  notes: "",
};

function dateInput(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function prettyDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  });
}

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function JobHuntBoard({ initialJobs }: { initialJobs: ClientJob[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [filter, setFilter] = useState<JobStatus | "All">("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientJob | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: jobs.length };
    JOB_STATUSES.forEach((s) => {
      c[s] = jobs.filter((j) => j.status === s).length;
    });
    return c;
  }, [jobs]);

  const visible = filter === "All" ? jobs : jobs.filter((j) => j.status === filter);
  const inPlay = jobs.filter((j) => ["Applied", "OA", "Interview"].includes(j.status)).length;
  const offers = counts.Offer || 0;
  const upcoming = jobs
    .filter((j) => j.nextDate && ["OA", "Interview", "Applied"].includes(j.status))
    .sort((a, b) => (a.nextDate || "").localeCompare(b.nextDate || ""))
    .slice(0, 3);

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm, appliedAt: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) });
    setError(null);
    setOpen(true);
  }

  function openEdit(job: ClientJob) {
    setEditing(job);
    setForm({
      company: job.company,
      role: job.role,
      location: job.location,
      jobUrl: job.jobUrl,
      status: job.status,
      source: job.source,
      appliedAt: dateInput(job.appliedAt),
      nextDate: dateInput(job.nextDate),
      salary: job.salary,
      notes: job.notes,
    });
    setError(null);
    setOpen(true);
  }

  function save() {
    startTransition(async () => {
      const res = await upsertJobAction({ id: editing?._id, ...form });
      if (!res.success) {
        setError(res.message || "Could not save");
        return;
      }
      setOpen(false);
      window.location.reload();
    });
  }

  function setStatus(job: ClientJob, status: JobStatus) {
    setJobs((prev) => prev.map((j) => (j._id === job._id ? { ...j, status } : j)));
    startTransition(async () => {
      await updateJobStatusAction(job._id, status);
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this application?")) return;
    setJobs((prev) => prev.filter((j) => j._id !== id));
    startTransition(async () => {
      await deleteJobAction(id);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Pipeline" value={jobs.length} />
        <Stat label="In play" value={inPlay} hint="Applied / OA / Interview" />
        <Stat label="Offers" value={offers} tone="text-emerald-400" />
        <Stat label="Rejected" value={counts.Rejected || 0} tone="text-red-400" />
      </div>

      {upcoming.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Coming up</p>
            <div className="space-y-2">
              {upcoming.map((j) => (
                <div key={j._id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">
                    {j.company} · {j.role}
                  </span>
                  <span className="text-primary shrink-0">{prettyDate(j.nextDate)} · {j.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {(["All", ...JOB_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`chip ${filter === s ? "chip-active" : ""}`}
            >
              {s} {counts[s] ? `(${counts[s]})` : ""}
            </button>
          ))}
        </div>
        <Button onClick={openAdd} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add application
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Building2} title="No applications here" hint="Add a company and role. Move status as OA / interview happens." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visible.map((job) => (
            <div key={job._id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{job.company}</p>
                  <p className="text-sm text-muted-foreground truncate">{job.role}</p>
                </div>
                <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[job.status]}`}>
                  {job.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                {job.location && <p>{job.location}</p>}
                {job.source && <p>via {job.source}</p>}
                {job.nextDate && <p className="text-primary">Next: {prettyDate(job.nextDate)}</p>}
                {job.salary && <p>{job.salary}</p>}
              </div>
              {job.notes && <p className="text-xs text-muted-foreground line-clamp-2">{job.notes}</p>}
              <div className="flex items-center gap-2">
                <select
                  value={job.status}
                  onChange={(e) => setStatus(job, e.target.value as JobStatus)}
                  className="h-8 flex-1 rounded-lg border border-border bg-transparent px-2 text-xs"
                  disabled={isPending}
                >
                  {JOB_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-card">
                      {s}
                    </option>
                  ))}
                </select>
                {job.jobUrl && (
                  <a href={job.jobUrl} target="_blank" rel="noreferrer" className="rounded-lg p-2 hover:bg-secondary" aria-label="Open posting">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => openEdit(job)} className="rounded-lg p-2 hover:bg-secondary" aria-label="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(job._id)} className="rounded-lg p-2 hover:bg-secondary text-destructive" aria-label="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit application" : "New application"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Company">
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="rounded-xl" />
            </Field>
            <Field label="Role">
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-xl" />
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="rounded-xl" />
            </Field>
            <Field label="Source">
              <Input placeholder="LinkedIn, referral…" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="rounded-xl" />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })} className={selectClass}>
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-card">{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Salary / CTC">
              <Input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="rounded-xl" />
            </Field>
            <Field label="Applied on">
              <Input type="date" value={form.appliedAt} onChange={(e) => setForm({ ...form, appliedAt: e.target.value })} className="rounded-xl" />
            </Field>
            <Field label="Next OA / interview">
              <Input type="date" value={form.nextDate} onChange={(e) => setForm({ ...form, nextDate: e.target.value })} className="rounded-xl" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Job URL">
                <Input value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} className="rounded-xl" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
                  placeholder="Prep notes, recruiter name, round details…"
                />
              </Field>
            </div>
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

function Stat({ label, value, hint, tone }: { label: string; value: number; hint?: string; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold mt-1 ${tone || ""}`}>{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 block text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
