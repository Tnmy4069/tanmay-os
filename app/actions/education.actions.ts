"use server";

import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import IitmCourse from "@/models/IitmCourse";
import IitmDeadline from "@/models/IitmDeadline";
import SkillCourse from "@/models/SkillCourse";
import SkillSession from "@/models/SkillSession";
import {
  IITM_COURSE_STATUSES,
  IITM_DEADLINE_STATUSES,
  IITM_DEADLINE_TYPES,
  SKILL_STATUSES,
  type IitmCourseStatus,
  type IitmDeadlineStatus,
  type IitmDeadlineType,
  type SkillStatus,
} from "@/lib/education-constants";
import { revalidatePath } from "next/cache";

function requireUser() {
  return auth().then((session) => {
    if (!session?.user?.id) throw new Error("Unauthorized");
    return session.user.id;
  });
}

function atNoonIST(dateStr?: string | null) {
  if (!dateStr) return undefined;
  return new Date(`${dateStr.slice(0, 10)}T12:00:00+05:30`);
}

function iso(d?: Date | null) {
  return d ? new Date(d).toISOString() : null;
}

export type ClientIitmCourse = {
  _id: string;
  title: string;
  code: string;
  term: string;
  credits: number;
  status: IitmCourseStatus;
  grade: string;
  notes: string;
};

export type ClientIitmDeadline = {
  _id: string;
  courseId: string;
  title: string;
  type: IitmDeadlineType;
  dueDate: string;
  status: IitmDeadlineStatus;
  score: string;
  notes: string;
};

export type ClientSkillCourse = {
  _id: string;
  title: string;
  platform: string;
  category: string;
  status: SkillStatus;
  progress: number;
  hoursLogged: number;
  url: string;
  notes: string;
  lastStudiedAt: string | null;
};

function toCourse(c: any): ClientIitmCourse {
  return {
    _id: String(c._id),
    title: c.title,
    code: c.code || "",
    term: c.term,
    credits: c.credits ?? 4,
    status: c.status,
    grade: c.grade || "",
    notes: c.notes || "",
  };
}

function toDeadline(d: any): ClientIitmDeadline {
  return {
    _id: String(d._id),
    courseId: String(d.courseId),
    title: d.title,
    type: d.type,
    dueDate: new Date(d.dueDate).toISOString(),
    status: d.status,
    score: d.score || "",
    notes: d.notes || "",
  };
}

function toSkill(c: any): ClientSkillCourse {
  return {
    _id: String(c._id),
    title: c.title,
    platform: c.platform,
    category: c.category || "",
    status: c.status,
    progress: c.progress ?? 0,
    hoursLogged: c.hoursLogged ?? 0,
    url: c.url || "",
    notes: c.notes || "",
    lastStudiedAt: iso(c.lastStudiedAt),
  };
}

export async function getIitmData() {
  const userId = await requireUser();
  await connectToDatabase();
  const [courses, deadlines] = await Promise.all([
    IitmCourse.find({ userId }).sort({ term: -1, title: 1 }).lean(),
    IitmDeadline.find({ userId }).sort({ dueDate: 1 }).lean(),
  ]);
  return { courses: courses.map(toCourse), deadlines: deadlines.map(toDeadline) };
}

export async function upsertIitmCourseAction(data: {
  id?: string;
  title: string;
  code?: string;
  term: string;
  credits: number;
  status: IitmCourseStatus;
  grade?: string;
  notes?: string;
}) {
  const userId = await requireUser();
  await connectToDatabase();
  if (!data.title?.trim() || !data.term?.trim()) {
    return { success: false, message: "Title and term are required." };
  }
  if (!IITM_COURSE_STATUSES.includes(data.status)) {
    return { success: false, message: "Invalid status." };
  }
  const payload = {
    title: data.title.trim(),
    code: data.code?.trim() || "",
    term: data.term.trim(),
    credits: Number(data.credits) || 4,
    status: data.status,
    grade: data.grade?.trim() || "",
    notes: data.notes?.trim() || "",
  };
  if (data.id) {
    await IitmCourse.findOneAndUpdate({ _id: data.id, userId }, { $set: payload });
  } else {
    await IitmCourse.create({ ...payload, userId });
  }
  revalidatePath("/education/iitm");
  return { success: true };
}

export async function deleteIitmCourseAction(id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await IitmDeadline.deleteMany({ userId, courseId: id });
  await IitmCourse.deleteOne({ _id: id, userId });
  revalidatePath("/education/iitm");
  return { success: true };
}

export async function upsertIitmDeadlineAction(data: {
  id?: string;
  courseId: string;
  title: string;
  type: IitmDeadlineType;
  dueDate: string;
  status: IitmDeadlineStatus;
  score?: string;
  notes?: string;
}) {
  const userId = await requireUser();
  await connectToDatabase();
  if (!data.courseId || !data.title?.trim() || !data.dueDate) {
    return { success: false, message: "Course, title, and due date are required." };
  }
  if (!IITM_DEADLINE_TYPES.includes(data.type) || !IITM_DEADLINE_STATUSES.includes(data.status)) {
    return { success: false, message: "Invalid type or status." };
  }
  const course = await IitmCourse.findOne({ _id: data.courseId, userId });
  if (!course) return { success: false, message: "Course not found." };

  const payload = {
    courseId: data.courseId,
    title: data.title.trim(),
    type: data.type,
    dueDate: atNoonIST(data.dueDate),
    status: data.status,
    score: data.score?.trim() || "",
    notes: data.notes?.trim() || "",
  };
  if (data.id) {
    await IitmDeadline.findOneAndUpdate({ _id: data.id, userId }, { $set: payload });
  } else {
    await IitmDeadline.create({ ...payload, userId });
  }
  revalidatePath("/education/iitm");
  return { success: true };
}

export async function updateIitmDeadlineStatusAction(id: string, status: IitmDeadlineStatus) {
  const userId = await requireUser();
  await connectToDatabase();
  await IitmDeadline.findOneAndUpdate({ _id: id, userId }, { $set: { status } });
  revalidatePath("/education/iitm");
  return { success: true };
}

export async function deleteIitmDeadlineAction(id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await IitmDeadline.deleteOne({ _id: id, userId });
  revalidatePath("/education/iitm");
  return { success: true };
}

export async function getSkillCourses() {
  const userId = await requireUser();
  await connectToDatabase();
  const items = await SkillCourse.find({ userId }).sort({ updatedAt: -1 }).lean();
  return items.map(toSkill);
}

export async function upsertSkillCourseAction(data: {
  id?: string;
  title: string;
  platform: string;
  category?: string;
  status: SkillStatus;
  progress: number;
  url?: string;
  notes?: string;
}) {
  const userId = await requireUser();
  await connectToDatabase();
  if (!data.title?.trim()) return { success: false, message: "Title is required." };
  if (!SKILL_STATUSES.includes(data.status)) return { success: false, message: "Invalid status." };
  const progress = Math.min(100, Math.max(0, Number(data.progress) || 0));
  const payload = {
    title: data.title.trim(),
    platform: data.platform || "Other",
    category: data.category?.trim() || "",
    status: data.status,
    progress,
    url: data.url?.trim() || "",
    notes: data.notes?.trim() || "",
  };
  if (data.id) {
    await SkillCourse.findOneAndUpdate({ _id: data.id, userId }, { $set: payload });
  } else {
    await SkillCourse.create({ ...payload, userId, hoursLogged: 0 });
  }
  revalidatePath("/education/upskilling");
  return { success: true };
}

export async function logSkillHoursAction(courseId: string, minutes: number, sessionDate?: string, notes?: string) {
  const userId = await requireUser();
  await connectToDatabase();
  const mins = Number(minutes);
  if (!Number.isFinite(mins) || mins < 1) return { success: false, message: "Minutes must be at least 1." };
  const course = await SkillCourse.findOne({ _id: courseId, userId });
  if (!course) return { success: false, message: "Course not found." };
  const hours = mins / 60;
  const when = atNoonIST(sessionDate) || new Date();
  await SkillSession.create({ userId, courseId, minutes: mins, sessionDate: when, notes: notes?.trim() || "" });
  await SkillCourse.findOneAndUpdate(
    { _id: courseId, userId },
    { $inc: { hoursLogged: hours }, $set: { lastStudiedAt: when } }
  );
  revalidatePath("/education/upskilling");
  return { success: true };
}

export async function deleteSkillCourseAction(id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await SkillSession.deleteMany({ userId, courseId: id });
  await SkillCourse.deleteOne({ _id: id, userId });
  revalidatePath("/education/upskilling");
  return { success: true };
}

export async function getSkillHoursThisMonth() {
  const userId = await requireUser();
  await connectToDatabase();
  const now = new Date();
  const start = new Date(`${now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 7)}-01T00:00:00+05:30`);
  const sessions = await SkillSession.find({ userId, sessionDate: { $gte: start } }).lean();
  return sessions.reduce((sum, s) => sum + (s.minutes || 0), 0) / 60;
}
