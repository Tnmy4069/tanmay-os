"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import {
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Globe,
  AlertTriangle,
  Loader2,
  Search,
  LayoutGrid,
  Kanban as KanbanIcon,
  Trophy,
  Zap,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/layout/EmptyState";
import {
  deleteJobAction,
  updateJobStatusAction,
  upsertJobAction,
  type ClientJob,
} from "@/app/actions/career.actions";
import { JOB_STATUSES, type JobStatus } from "@/lib/career-constants";
import { mutateWithOffline, putLocal, deleteLocal, getLocalAll } from "@/lib/offline/mutate";
import { useOnlineStatus } from "@/lib/offline/hooks";
import { formatRelativeDay } from "@/lib/task-dates";

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; bg: string; text: string; border: string; iconBg: string }
> = {
  Wishlist: {
    label: "Wishlist",
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/20",
    iconBg: "bg-slate-500/20 text-slate-600 dark:text-slate-400",
  },
  Applied: {
    label: "Applied",
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/30",
    iconBg: "bg-sky-500/20 text-sky-600 dark:text-sky-400",
  },
  OA: {
    label: "OA (Assessment)",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    iconBg: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  },
  Interview: {
    label: "Interview",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/30",
    iconBg: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  },
  Offer: {
    label: "Offer 🎉",
    bg: "bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/40 font-bold",
    iconBg: "bg-emerald-500/25 text-emerald-600 dark:text-emerald-400",
  },
  Rejected: {
    label: "Rejected",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/30",
    iconBg: "bg-red-500/20 text-red-600 dark:text-red-400",
  },
  Ghosted: {
    label: "Ghosted",
    bg: "bg-zinc-500/10",
    text: "text-zinc-500",
    border: "border-zinc-500/30",
    iconBg: "bg-zinc-500/20 text-zinc-500",
  },
};

const LOCATION_PRESETS = ["Remote", "Bengaluru", "Hyderabad", "Noida / Gurgaon", "Pune", "Mumbai"];
const SOURCE_PRESETS = ["LinkedIn", "Referral", "Instahyre", "Careers Portal", "Cold Email", "Wellfound"];

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
  return formatRelativeDay(iso);
}

function getCompanyInitial(company: string): string {
  if (!company) return "?";
  return company.trim().charAt(0).toUpperCase();
}

function getCompanyColor(company: string): string {
  const colors = [
    "from-blue-500 to-indigo-600 text-white",
    "from-emerald-500 to-teal-600 text-white",
    "from-purple-500 to-pink-600 text-white",
    "from-amber-500 to-orange-600 text-white",
    "from-rose-500 to-red-600 text-white",
    "from-cyan-500 to-blue-600 text-white",
  ];
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function JobHuntBoard({ initialJobs }: { initialJobs: ClientJob[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [filter, setFilter] = useState<JobStatus | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "board">("grid");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientJob | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const online = useOnlineStatus();

  useEffect(() => {
    if (!online) {
      getLocalAll<ClientJob>("jobs").then((rows) => {
        if (rows.length) setJobs(rows);
      });
    }
  }, [online]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: jobs.length };
    JOB_STATUSES.forEach((s) => {
      c[s] = jobs.filter((j) => j.status === s).length;
    });
    return c;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesFilter = filter === "All" || j.status === filter;
      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        j.company.toLowerCase().includes(q) ||
        j.role.toLowerCase().includes(q) ||
        (j.location && j.location.toLowerCase().includes(q)) ||
        (j.source && j.source.toLowerCase().includes(q)) ||
        (j.notes && j.notes.toLowerCase().includes(q))
      );
    });
  }, [jobs, filter, searchQuery]);

  const inPlay = jobs.filter((j) => ["Applied", "OA", "Interview"].includes(j.status)).length;
  const offers = counts.Offer || 0;
  const upcoming = useMemo(() => {
    return jobs
      .filter((j) => j.nextDate && ["OA", "Interview", "Applied"].includes(j.status))
      .sort((a, b) => (a.nextDate || "").localeCompare(b.nextDate || ""))
      .slice(0, 3);
  }, [jobs]);

  function openAdd(defaultStatus?: JobStatus) {
    setEditing(null);
    setForm({
      ...emptyForm,
      status: defaultStatus || "Applied",
      appliedAt: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
    });
    setError(null);
    setOpen(true);
  }

  function openEdit(job: ClientJob) {
    setEditing(job);
    setForm({
      company: job.company,
      role: job.role,
      location: job.location || "",
      jobUrl: job.jobUrl || "",
      status: job.status,
      source: job.source || "",
      appliedAt: dateInput(job.appliedAt),
      nextDate: dateInput(job.nextDate),
      salary: job.salary || "",
      notes: job.notes || "",
    });
    setError(null);
    setOpen(true);
  }

  function save() {
    if (!form.company.trim() || !form.role.trim()) {
      setError("Company name and Role are required.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const payload = { id: editing?._id, ...form };
      const { result: res, offline } = await mutateWithOffline({
        action: "upsertJob",
        payload,
        onlineFn: () => upsertJobAction(payload),
        offlineApply: async () => {
          const row: ClientJob = {
            _id: editing?._id || crypto.randomUUID(),
            company: form.company,
            role: form.role,
            location: form.location,
            jobUrl: form.jobUrl,
            status: form.status,
            source: form.source,
            appliedAt: form.appliedAt ? new Date(form.appliedAt).toISOString() : null,
            nextDate: form.nextDate ? new Date(form.nextDate).toISOString() : null,
            salary: form.salary,
            notes: form.notes,
          };
          await putLocal("jobs", row);
          setJobs((prev) => {
            const idx = prev.findIndex((j) => j._id === row._id);
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
        setError((res as any).message || "Could not save application");
        return;
      }
      setOpen(false);
      if (!offline) window.location.reload();
    });
  }

  function setStatus(job: ClientJob, status: JobStatus) {
    setJobs((prev) => prev.map((j) => (j._id === job._id ? { ...j, status } : j)));
    startTransition(async () => {
      await mutateWithOffline({
        action: "updateJobStatus",
        payload: { id: job._id, status },
        onlineFn: () => updateJobStatusAction(job._id, status),
        offlineApply: async () => {
          await putLocal("jobs", { ...job, status });
        },
      });
    });
  }

  function remove(id: string) {
    if (!confirm("Are you sure you want to delete this job application?")) return;
    setJobs((prev) => prev.filter((j) => j._id !== id));
    if (editing?._id === id) {
      setOpen(false);
    }
    startTransition(async () => {
      await mutateWithOffline({
        action: "deleteJob",
        payload: { id },
        onlineFn: () => deleteJobAction(id),
        offlineApply: async () => {
          await deleteLocal("jobs", id);
        },
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          icon={Briefcase}
          label="Total Pipeline"
          value={jobs.length}
          subtext="Active applications"
          gradient="from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={Zap}
          label="In Play"
          value={inPlay}
          subtext="Applied · OA · Interview"
          gradient="from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={Trophy}
          label="Offers Secured"
          value={offers}
          subtext="Offer stage reached"
          gradient="from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold"
        />
        <StatCard
          icon={Clock}
          label="Conversion / Closed"
          value={counts.Rejected || 0}
          subtext={`Ghosted: ${counts.Ghosted || 0}`}
          gradient="from-slate-500/10 to-zinc-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400"
        />
      </div>

      {/* Upcoming Rounds Alert Banner */}
      {upcoming.length > 0 && (
        <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              Upcoming Rounds & Assessment Deadlines
            </h3>
            <span className="text-xs font-semibold text-muted-foreground">
              {upcoming.length} upcoming
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {upcoming.map((j) => (
              <div
                key={j._id}
                onClick={() => openEdit(j)}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-card border border-border/80 hover:border-primary/50 cursor-pointer transition-all shadow-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-xs text-foreground truncate">{j.company}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{j.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-primary block">
                    {prettyDate(j.nextDate)}
                  </span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.2 rounded-full font-bold border ${STATUS_CONFIG[j.status].bg} ${STATUS_CONFIG[j.status].text} ${STATUS_CONFIG[j.status].border}`}
                  >
                    {j.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls Bar: Search, Status Chips, View Toggle, Add Button */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, role, location, notes..."
              className="pl-9 h-10 rounded-xl text-sm font-medium border-2"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Switcher & Add Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-muted/40 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid View"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "grid"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("board")}
                title="Kanban Board View"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "board"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <KanbanIcon className="w-4 h-4" />
              </button>
            </div>

            <Button
              onClick={() => openAdd()}
              className="rounded-xl font-bold shadow-sm hover:shadow-md transition-all gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Application</span>
            </Button>
          </div>
        </div>

        {/* Filter Status Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button
            onClick={() => setFilter("All")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              filter === "All"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            All <span className="opacity-75">({jobs.length})</span>
          </button>
          {JOB_STATUSES.map((s) => {
            const isSelected = filter === s;
            const count = counts[s] || 0;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{s}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications Main View */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchQuery ? "No matching applications" : "No applications found"}
          hint={
            searchQuery
              ? "Try modifying your search or filter criteria."
              : "Add your first company application to track recruitment rounds and stages."
          }
        />
      ) : viewMode === "board" ? (
        /* KANBAN BOARD VIEW */
        <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
          {JOB_STATUSES.map((status) => {
            const columnJobs = filteredJobs.filter((j) => j.status === status);
            const cfg = STATUS_CONFIG[status];
            return (
              <div
                key={status}
                className="w-72 shrink-0 flex flex-col bg-muted/30 border-2 border-border rounded-2xl p-3 space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      {status}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {columnJobs.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAdd(status)}
                    title={`Add ${status} Application`}
                    className="p-1 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 overflow-y-auto max-h-[650px] pr-0.5">
                  {columnJobs.map((job) => (
                    <div
                      key={job._id}
                      onClick={() => openEdit(job)}
                      className="group p-3 bg-card border-2 border-border hover:border-primary/40 rounded-xl space-y-2.5 cursor-pointer shadow-xs hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getCompanyColor(
                            job.company
                          )} flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                        >
                          {getCompanyInitial(job.company)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-foreground truncate">{job.company}</h4>
                          <p className="text-xs text-muted-foreground truncate">{job.role}</p>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-muted-foreground">
                        {job.location && (
                          <p className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3 h-3 shrink-0 opacity-60" />
                            <span>{job.location}</span>
                          </p>
                        )}
                        {job.nextDate && (
                          <p className="text-primary font-bold flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 shrink-0" />
                            Next: {prettyDate(job.nextDate)}
                          </p>
                        )}
                      </div>

                      {job.salary && (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                          {job.salary}
                        </span>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                        <span className="text-[10px] text-muted-foreground">
                          {prettyDate(job.appliedAt)}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {job.jobUrl && (
                            <a
                              href={job.jobUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(job);
                            }}
                            className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {columnJobs.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground border-2 border-dashed border-border/70 rounded-xl">
                      No applications
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredJobs.map((job) => {
            const cfg = STATUS_CONFIG[job.status];
            return (
              <div
                key={job._id}
                onClick={() => openEdit(job)}
                className="group rounded-2xl border-2 border-border bg-card hover:bg-accent/10 p-4 space-y-3.5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Card Header: Company Logo Avatar & Name + Status Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCompanyColor(
                          job.company
                        )} flex items-center justify-center font-bold text-sm shrink-0 shadow-xs`}
                      >
                        {getCompanyInitial(job.company)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-base text-foreground truncate">{job.company}</h4>
                        <p className="text-xs font-semibold text-muted-foreground truncate">{job.role}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 border font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      {job.status}
                    </span>
                  </div>

                  {/* Metadata Info Tags */}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {job.location && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        <span className="truncate">{job.location}</span>
                      </p>
                    )}
                    {job.salary && (
                      <p className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 shrink-0 opacity-60 text-emerald-500" />
                        <span className="font-semibold text-foreground truncate">{job.salary}</span>
                      </p>
                    )}
                    {job.source && (
                      <p className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        <span>Source: <span className="font-medium text-foreground">{job.source}</span></span>
                      </p>
                    )}
                    {job.nextDate && (
                      <p className="text-primary font-bold flex items-center gap-2 bg-primary/5 p-1.5 rounded-lg border border-primary/20">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        Next Round: {prettyDate(job.nextDate)}
                      </p>
                    )}
                    {job.appliedAt && (
                      <p className="text-muted-foreground text-[11px]">
                        Applied on: {prettyDate(job.appliedAt)}
                      </p>
                    )}
                  </div>

                  {/* Notes Snippet */}
                  {job.notes && (
                    <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl line-clamp-2 border border-border/50">
                      "{job.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 pt-2.5 border-t border-border/50"
                >
                  <select
                    value={job.status}
                    onChange={(e) => setStatus(job, e.target.value as JobStatus)}
                    className="h-8 flex-1 rounded-xl border-2 border-input bg-card px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={isPending}
                  >
                    {JOB_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-card">
                        {s}
                      </option>
                    ))}
                  </select>

                  {job.jobUrl && (
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl p-2 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border"
                      aria-label="Open job posting"
                      title="Open posting"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => openEdit(job)}
                    className="rounded-xl p-2 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border"
                    aria-label="Edit application"
                    title="Edit application"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(job._id)}
                    className="rounded-xl p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors border border-border"
                    aria-label="Delete application"
                    title="Delete application"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP MODAL FOR ADD / EDIT JOB APPLICATION */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col gap-0 max-lg:gap-0 lg:gap-0 p-0 max-lg:p-0 lg:p-0 max-h-[85vh] lg:max-h-[85vh] w-[calc(100%-1.5rem)] max-w-lg overflow-hidden rounded-2xl sm:rounded-3xl border-2 shadow-2xl">
          {/* Mobile handle indicator */}
          <div className="lg:hidden flex justify-center pt-2.5 pb-1">
            <div className="h-1.5 w-10 rounded-full bg-border" />
          </div>

          {/* Fixed Header */}
          <div className="shrink-0 px-4 py-3.5 sm:px-6 sm:py-4 border-b bg-card/70">
            <DialogHeader className="text-left space-y-0.5">
              <div className="flex items-center gap-2.5 pr-6">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border bg-primary/10 text-primary border-primary/20">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold">
                    {editing ? "Edit Job Application" : "New Job Application"}
                  </DialogTitle>
                  <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground">
                    Track hiring pipeline, interview stages, and deadlines.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Scrollable Form Body */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Status Selection Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Current Status
              </label>
              <div className="flex flex-wrap gap-1.5">
                {JOB_STATUSES.map((s) => {
                  const isSelected = form.status === s;
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, status: s }))}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? `${cfg.bg} ${cfg.text} ${cfg.border} border-2 shadow-xs scale-[1.02]`
                          : "border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Company and Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Company Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. Google, Atlassian, Razorpay"
                  className="h-10 rounded-xl text-sm font-medium border-2"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Role / Position <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. SDE 1, Frontend Engineer"
                  className="h-10 rounded-xl text-sm font-medium border-2"
                />
              </div>
            </div>

            {/* Location & Quick Location Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Location / Remote
              </label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Bengaluru / Remote"
                className="h-10 rounded-xl text-sm font-medium border-2"
              />
              <div className="flex flex-wrap gap-1 pt-0.5">
                {LOCATION_PRESETS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, location: loc }))}
                    className="text-[11px] px-2 py-0.5 rounded-lg border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Salary & Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Salary / CTC (Optional)
                </label>
                <Input
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  placeholder="e.g. ₹18-24 LPA / $120k"
                  className="h-10 rounded-xl text-sm font-medium border-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Source / Portal
                </label>
                <Input
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="e.g. LinkedIn, Referral"
                  className="h-10 rounded-xl text-sm font-medium border-2"
                />
              </div>
            </div>

            {/* Quick Source Chips */}
            <div className="flex flex-wrap gap-1">
              {SOURCE_PRESETS.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, source: src }))}
                  className="text-[11px] px-2 py-0.5 rounded-lg border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  {src}
                </button>
              ))}
            </div>

            {/* Job URL */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Job URL / Posting Link
              </label>
              <Input
                value={form.jobUrl}
                onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
                placeholder="https://careers.google.com/..."
                className="h-10 rounded-xl text-sm font-medium border-2"
              />
            </div>

            {/* Dates: Applied & Next Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Applied Date
                </label>
                <Input
                  type="date"
                  value={form.appliedAt}
                  onChange={(e) => setForm({ ...form, appliedAt: e.target.value })}
                  className="h-10 rounded-xl text-sm font-medium border-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Next Round / OA Date</span>
                  {form.nextDate && (
                    <span className="text-primary font-bold lowercase text-[10px]">
                      {prettyDate(form.nextDate)}
                    </span>
                  )}
                </label>
                <Input
                  type="date"
                  value={form.nextDate}
                  onChange={(e) => setForm({ ...form, nextDate: e.target.value })}
                  className="h-10 rounded-xl text-sm font-medium border-2"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Notes & Prep Details
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full rounded-xl border-2 border-input bg-card px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Interview rounds info, referral details, recruiter contact, DSA topics asked..."
              />
            </div>
          </div>

          {/* Fixed Footer Actions */}
          <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 border-t bg-muted/20 flex items-center justify-between gap-2">
            {editing ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => editing && remove(editing._id)}
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
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-xl text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={save}
                disabled={isPending}
                className="rounded-xl font-bold min-w-[110px] text-xs h-9"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : editing ? (
                  "Update Application"
                ) : (
                  "Save Application"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  subtext: string;
  gradient: string;
}) {
  return (
    <div className={`p-4 rounded-2xl border-2 bg-gradient-to-br ${gradient} space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase font-bold tracking-wider opacity-80">{label}</span>
        <Icon className="w-4 h-4 opacity-70" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-[11px] opacity-75 font-medium mt-0.5">{subtext}</p>
      </div>
    </div>
  );
}
