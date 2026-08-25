"use client";

import { useState, useTransition } from "react";
import { Calendar, Plus, Trash2, Users } from "lucide-react";
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
  deleteCtfAction,
  deleteLeadEventAction,
  deleteLeadMemberAction,
  deleteLeadTaskAction,
  updateLeadTaskStatusAction,
  upsertCtfAction,
  upsertLeadEventAction,
  upsertLeadMemberAction,
  upsertLeadTaskAction,
  type ClientCtf,
  type ClientLeadEvent,
  type ClientLeadMember,
  type ClientLeadTask,
} from "@/app/actions/leadership.actions";
import {
  CTF_RESULTS,
  LEADERSHIP_EVENT_STATUSES,
  LEADERSHIP_EVENT_TYPES,
  LEADERSHIP_TASK_STATUSES,
  type CtfResult,
  type LeadershipClub,
  type LeadershipEventStatus,
  type LeadershipEventType,
  type LeadershipTaskStatus,
} from "@/lib/leadership-constants";

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function pretty(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  });
}

function dayIST(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

type Tab = "tasks" | "events" | "team" | "ctf";

export function LeadershipHub({
  club,
  showCtf,
  initialEvents,
  initialTasks,
  initialMembers,
  initialCtfs,
}: {
  club: LeadershipClub;
  showCtf?: boolean;
  initialEvents: ClientLeadEvent[];
  initialTasks: ClientLeadTask[];
  initialMembers: ClientLeadMember[];
  initialCtfs?: ClientCtf[];
}) {
  const [tab, setTab] = useState<Tab>("tasks");
  const [events, setEvents] = useState(initialEvents);
  const [tasks, setTasks] = useState(initialTasks);
  const [members, setMembers] = useState(initialMembers);
  const [ctfs, setCtfs] = useState(initialCtfs || []);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [taskOpen, setTaskOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [ctfOpen, setCtfOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const openTasks = tasks.filter((t) => t.status === "Todo" || t.status === "Doing" || t.status === "Blocked");
  const upcoming = events.filter((e) => e.status === "Planned" && dayIST(e.eventDate) >= today);
  const solvedCtfs = ctfs.filter((c) => c.result === "Solved").length;

  const [taskForm, setTaskForm] = useState({
    title: "",
    owner: "",
    status: "Todo" as LeadershipTaskStatus,
    dueDate: "",
    notes: "",
  });
  const [eventForm, setEventForm] = useState({
    title: "",
    type: (club === "CyberX" ? "Workshop" : "Meeting") as LeadershipEventType,
    eventDate: "",
    location: "",
    status: "Planned" as LeadershipEventStatus,
    notes: "",
  });
  const [memberForm, setMemberForm] = useState({ name: "", role: "", contact: "", notes: "" });
  const [ctfForm, setCtfForm] = useState({
    title: "",
    category: "",
    platform: "",
    result: "Attempted" as CtfResult,
    eventDate: "",
    notes: "",
  });

  function reloadAfter(ok: boolean, message?: string) {
    if (!ok) {
      setError(message || "Could not save");
      return;
    }
    window.location.reload();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "tasks", label: "Tasks" },
    { id: "events", label: "Events" },
    { id: "team", label: "Team" },
    ...(showCtf ? [{ id: "ctf" as const, label: "CTF log" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Open tasks" value={openTasks.length} />
        <Stat label="Upcoming events" value={upcoming.length} />
        <Stat label="Team" value={members.length} />
        {showCtf ? <Stat label="CTFs solved" value={solvedCtfs} tone="text-primary" /> : <Stat label="Done events" value={events.filter((e) => e.status === "Done").length} />}
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tasks" && (
        <section className="space-y-3">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setTaskForm({ title: "", owner: "", status: "Todo", dueDate: "", notes: "" });
                setError(null);
                setTaskOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add task
            </Button>
          </div>
          {tasks.length === 0 ? (
            <EmptyState icon={Users} title="No club tasks" hint="Sponsors, posters, speakers, venue — dump deliverables here." />
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t._id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.owner || "Unassigned"}
                      {t.dueDate ? ` · due ${pretty(t.dueDate)}` : ""}
                    </p>
                    {t.notes && <p className="text-xs text-muted-foreground mt-1">{t.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={t.status}
                      disabled={isPending}
                      onChange={(e) => {
                        const status = e.target.value as LeadershipTaskStatus;
                        setTasks((prev) => prev.map((x) => (x._id === t._id ? { ...x, status } : x)));
                        startTransition(async () => {
                          await updateLeadTaskStatusAction(club, t._id, status);
                        });
                      }}
                      className="h-8 rounded-lg border border-white/10 bg-transparent px-2 text-xs"
                    >
                      {LEADERSHIP_TASK_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-card">{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        setTasks((prev) => prev.filter((x) => x._id !== t._id));
                        startTransition(async () => {
                          await deleteLeadTaskAction(club, t._id);
                        });
                      }}
                      className="p-2 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "events" && (
        <section className="space-y-3">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEventForm({
                  title: "",
                  type: club === "CyberX" ? "Workshop" : "Meeting",
                  eventDate: today,
                  location: "",
                  status: "Planned",
                  notes: "",
                });
                setError(null);
                setEventOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add event
            </Button>
          </div>
          {events.length === 0 ? (
            <EmptyState icon={Calendar} title="No events" hint="Meetings, workshops, and club days live here." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {events.map((e) => (
                <div key={e._id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold">{e.title}</p>
                    <span className="text-[10px] uppercase text-muted-foreground">{e.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {e.type} · {pretty(e.eventDate)}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                  {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
                  <button
                    onClick={() => {
                      setEvents((prev) => prev.filter((x) => x._id !== e._id));
                      startTransition(async () => {
                        await deleteLeadEventAction(club, e._id);
                      });
                    }}
                    className="text-xs text-destructive"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "team" && (
        <section className="space-y-3">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setMemberForm({ name: "", role: "", contact: "", notes: "" });
                setError(null);
                setMemberOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add member
            </Button>
          </div>
          {members.length === 0 ? (
            <EmptyState icon={Users} title="No members listed" hint="Core team, coordinators, and volunteers." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {members.map((m) => (
                <div key={m._id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-sm text-primary">{m.role}</p>
                  {m.contact && <p className="text-xs text-muted-foreground mt-1">{m.contact}</p>}
                  {m.notes && <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>}
                  <button
                    onClick={() => {
                      setMembers((prev) => prev.filter((x) => x._id !== m._id));
                      startTransition(async () => {
                        await deleteLeadMemberAction(club, m._id);
                      });
                    }}
                    className="text-xs text-destructive mt-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "ctf" && showCtf && (
        <section className="space-y-3">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setCtfForm({
                  title: "",
                  category: "",
                  platform: "",
                  result: "Attempted",
                  eventDate: today,
                  notes: "",
                });
                setError(null);
                setCtfOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Log challenge
            </Button>
          </div>
          {ctfs.length === 0 ? (
            <EmptyState icon={Calendar} title="No CTF logs" hint="Web, crypto, pwn — log what the club attempted." />
          ) : (
            <div className="space-y-2">
              {ctfs.map((c) => (
                <div key={c._id} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex-1">
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.result}
                      {c.category ? ` · ${c.category}` : ""}
                      {c.platform ? ` · ${c.platform}` : ""} · {pretty(c.eventDate)}
                    </p>
                    {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                  </div>
                  <button
                    onClick={() => {
                      setCtfs((prev) => prev.filter((x) => x._id !== c._id));
                      startTransition(async () => {
                        await deleteCtfAction(c._id);
                      });
                    }}
                    className="p-2 text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New {club} task</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Title</span>
              <Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Owner</span>
              <Input value={taskForm.owner} onChange={(e) => setTaskForm({ ...taskForm, owner: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Status</span>
              <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as LeadershipTaskStatus })} className={selectClass}>
                {LEADERSHIP_TASK_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-card">{s}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Due</span>
              <Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="rounded-xl" />
            </label>
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Notes</span>
              <textarea value={taskForm.notes} onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm" />
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskOpen(false)}>Cancel</Button>
            <Button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await upsertLeadTaskAction({ club, ...taskForm });
                  reloadAfter(res.success, res.message);
                })
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New event</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Title</span>
              <Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Type</span>
              <select value={eventForm.type} onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as LeadershipEventType })} className={selectClass}>
                {LEADERSHIP_EVENT_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-card">{t}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Date</span>
              <Input type="date" value={eventForm.eventDate} onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Location</span>
              <Input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Status</span>
              <select value={eventForm.status} onChange={(e) => setEventForm({ ...eventForm, status: e.target.value as LeadershipEventStatus })} className={selectClass}>
                {LEADERSHIP_EVENT_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-card">{s}</option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Notes</span>
              <textarea value={eventForm.notes} onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm" />
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventOpen(false)}>Cancel</Button>
            <Button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await upsertLeadEventAction({ club, ...eventForm });
                  reloadAfter(res.success, res.message);
                })
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Name</span>
              <Input value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Role</span>
              <Input value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })} className="rounded-xl" placeholder="Coordinator, volunteer…" />
            </label>
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Contact</span>
              <Input value={memberForm.contact} onChange={(e) => setMemberForm({ ...memberForm, contact: e.target.value })} className="rounded-xl" />
            </label>
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Notes</span>
              <textarea value={memberForm.notes} onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm" />
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberOpen(false)}>Cancel</Button>
            <Button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await upsertLeadMemberAction({ club, ...memberForm });
                  reloadAfter(res.success, res.message);
                })
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ctfOpen} onOpenChange={setCtfOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log CTF challenge</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Title</span>
              <Input value={ctfForm.title} onChange={(e) => setCtfForm({ ...ctfForm, title: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Category</span>
              <Input value={ctfForm.category} onChange={(e) => setCtfForm({ ...ctfForm, category: e.target.value })} className="rounded-xl" placeholder="Web, crypto…" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Platform</span>
              <Input value={ctfForm.platform} onChange={(e) => setCtfForm({ ...ctfForm, platform: e.target.value })} className="rounded-xl" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Result</span>
              <select value={ctfForm.result} onChange={(e) => setCtfForm({ ...ctfForm, result: e.target.value as CtfResult })} className={selectClass}>
                {CTF_RESULTS.map((r) => (
                  <option key={r} value={r} className="bg-card">{r}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">Date</span>
              <Input type="date" value={ctfForm.eventDate} onChange={(e) => setCtfForm({ ...ctfForm, eventDate: e.target.value })} className="rounded-xl" />
            </label>
            <label className="sm:col-span-2 space-y-1.5 text-sm">
              <span className="text-muted-foreground">Notes</span>
              <textarea value={ctfForm.notes} onChange={(e) => setCtfForm({ ...ctfForm, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm" />
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCtfOpen(false)}>Cancel</Button>
            <Button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await upsertCtfAction(ctfForm);
                  reloadAfter(res.success, res.message);
                })
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold mt-1 ${tone || ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
