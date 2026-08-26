import connectToDatabase from "@/lib/db";
import Task from "@/models/Task";
import ScheduleBlock from "@/models/ScheduleBlock";
import DailyCheckin from "@/models/DailyCheckin";
import JobApplication from "@/models/JobApplication";
import DsaProblem from "@/models/DsaProblem";
import AptitudeSession from "@/models/AptitudeSession";
import IitmCourse from "@/models/IitmCourse";
import IitmDeadline from "@/models/IitmDeadline";
import SkillCourse from "@/models/SkillCourse";
import SkillSession from "@/models/SkillSession";
import LeadershipEvent from "@/models/LeadershipEvent";
import LeadershipTask from "@/models/LeadershipTask";
import LeadershipMember from "@/models/LeadershipMember";
import CtfChallenge from "@/models/CtfChallenge";
import SpaceConfig from "@/models/SpaceConfig";
import SpaceNote from "@/models/SpaceNote";
import { toClientTask } from "@/lib/serialize";
import { defaultCores } from "@/lib/spaces";
import { auth } from "@/lib/auth";

function iso(d?: Date | null) {
  return d ? new Date(d).toISOString() : null;
}

function id(doc: { _id: unknown }) {
  return String(doc._id);
}

export async function requireSyncUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.id;
}

export async function buildSyncSnapshot(userId: string) {
  await connectToDatabase();

  const [
    tasks,
    schedule,
    checkins,
    jobs,
    dsa,
    aptitude,
    iitmCourses,
    iitmDeadlines,
    skillCourses,
    skillSessions,
    leadEvents,
    leadTasks,
    leadMembers,
    ctfs,
    spaceConfig,
    spaceNotes,
  ] = await Promise.all([
    Task.find({ userId }).lean(),
    ScheduleBlock.find({ userId }).lean(),
    DailyCheckin.find({ userId }).sort({ date: -1 }).limit(180).lean(),
    JobApplication.find({ userId }).lean(),
    DsaProblem.find({ userId }).lean(),
    AptitudeSession.find({ userId }).lean(),
    IitmCourse.find({ userId }).lean(),
    IitmDeadline.find({ userId }).lean(),
    SkillCourse.find({ userId }).lean(),
    SkillSession.find({ userId }).lean(),
    LeadershipEvent.find({ userId }).lean(),
    LeadershipTask.find({ userId }).lean(),
    LeadershipMember.find({ userId }).lean(),
    CtfChallenge.find({ userId }).lean(),
    SpaceConfig.findOne({ userId }).lean(),
    SpaceNote.find({ userId }).lean(),
  ]);

  return {
    pulledAt: new Date().toISOString(),
    userId,
    domains: {
      tasks: tasks.map(toClientTask),
      schedule: schedule.map((b: any) => ({
        _id: id(b),
        title: b.title,
        dayOfWeek: b.dayOfWeek,
        startTime: b.startTime,
        endTime: b.endTime,
        type: b.type,
        isFixed: Boolean(b.isFixed),
        allowOverride: Boolean(b.allowOverride),
      })),
      checkins: checkins.map((c: any) => ({
        _id: id(c),
        date: iso(c.date),
        followedRoutine: Boolean(c.followedRoutine),
        notes: c.notes || "",
        workLogs: (c.workLogs || []).map((log: any) => ({
          blockId: String(log.blockId),
          title: log.title,
          startTime: log.startTime,
          endTime: log.endTime,
          note: log.note || "",
        })),
      })),
      jobs: jobs.map((j: any) => ({
        _id: id(j),
        company: j.company,
        role: j.role,
        location: j.location || "",
        jobUrl: j.jobUrl || "",
        status: j.status,
        source: j.source || "",
        appliedAt: iso(j.appliedAt),
        nextDate: iso(j.nextDate),
        salary: j.salary || "",
        notes: j.notes || "",
      })),
      dsa: dsa.map((p: any) => ({
        _id: id(p),
        title: p.title,
        url: p.url || "",
        platform: p.platform,
        topic: p.topic,
        difficulty: p.difficulty,
        status: p.status,
        minutes: typeof p.minutes === "number" ? p.minutes : null,
        notes: p.notes || "",
        solvedAt: iso(p.solvedAt),
      })),
      aptitude: aptitude.map((s: any) => ({
        _id: id(s),
        category: s.category,
        topic: s.topic || "",
        attempted: s.attempted,
        correct: s.correct,
        minutes: typeof s.minutes === "number" ? s.minutes : null,
        notes: s.notes || "",
        sessionDate: iso(s.sessionDate),
      })),
      iitmCourses: iitmCourses.map((c: any) => ({
        _id: id(c),
        title: c.title,
        code: c.code || "",
        term: c.term,
        credits: c.credits,
        status: c.status,
        grade: c.grade || "",
        notes: c.notes || "",
      })),
      iitmDeadlines: iitmDeadlines.map((d: any) => ({
        _id: id(d),
        courseId: d.courseId ? String(d.courseId) : "",
        title: d.title,
        type: d.type,
        dueDate: iso(d.dueDate),
        status: d.status,
        notes: d.notes || "",
      })),
      skillCourses: skillCourses.map((c: any) => ({
        _id: id(c),
        title: c.title,
        category: c.category || "",
        platform: c.platform || "",
        url: c.url || "",
        status: c.status,
        progress: c.progress ?? 0,
        totalMinutes: c.totalMinutes ?? 0,
        notes: c.notes || "",
      })),
      skillSessions: skillSessions.map((s: any) => ({
        _id: id(s),
        courseId: String(s.courseId),
        minutes: s.minutes,
        sessionDate: iso(s.sessionDate),
        notes: s.notes || "",
      })),
      leadEvents: leadEvents.map((e: any) => ({
        _id: id(e),
        club: e.club,
        title: e.title,
        type: e.type,
        eventDate: iso(e.eventDate) || iso(e.date),
        location: e.location || "",
        status: e.status,
        notes: e.notes || "",
      })),
      leadTasks: leadTasks.map((t: any) => ({
        _id: id(t),
        club: t.club,
        title: t.title,
        owner: t.owner || "",
        status: t.status,
        dueDate: iso(t.dueDate),
        notes: t.notes || "",
      })),
      leadMembers: leadMembers.map((m: any) => ({
        _id: id(m),
        club: m.club,
        name: m.name,
        role: m.role || "",
        contact: m.contact || "",
        notes: m.notes || "",
      })),
      ctfs: ctfs.map((c: any) => ({
        _id: id(c),
        title: c.title,
        category: c.category || "",
        platform: c.platform || "",
        result: c.result,
        eventDate: iso(c.eventDate) || iso(c.date),
        notes: c.notes || "",
      })),
      spaces: {
        cores: spaceConfig?.cores?.length ? spaceConfig.cores : defaultCores(),
        notes: spaceNotes.map((n: any) => ({
          _id: id(n),
          coreSlug: n.coreSlug,
          itemSlug: n.itemSlug,
          notes: n.notes || "",
        })),
      },
    },
  };
}

export type SyncSnapshot = Awaited<ReturnType<typeof buildSyncSnapshot>>;
