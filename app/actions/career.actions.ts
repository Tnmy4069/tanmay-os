"use server";

import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import JobApplication from "@/models/JobApplication";
import DsaProblem from "@/models/DsaProblem";
import AptitudeSession from "@/models/AptitudeSession";
import { JOB_STATUSES, APTITUDE_CATEGORIES, type JobStatus } from "@/lib/career-constants";
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

export type ClientJob = {
  _id: string;
  company: string;
  role: string;
  location: string;
  jobUrl: string;
  status: JobStatus;
  source: string;
  appliedAt: string | null;
  nextDate: string | null;
  salary: string;
  notes: string;
};

export type ClientDsa = {
  _id: string;
  title: string;
  url: string;
  platform: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "Solved" | "Attempted" | "Revisit";
  minutes: number | null;
  notes: string;
  solvedAt: string;
};

export type ClientAptitude = {
  _id: string;
  category: string;
  topic: string;
  attempted: number;
  correct: number;
  minutes: number | null;
  notes: string;
  sessionDate: string;
};

function toJob(j: any): ClientJob {
  return {
    _id: String(j._id),
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
  };
}

function toDsa(p: any): ClientDsa {
  return {
    _id: String(p._id),
    title: p.title,
    url: p.url || "",
    platform: p.platform,
    topic: p.topic,
    difficulty: p.difficulty,
    status: p.status,
    minutes: typeof p.minutes === "number" ? p.minutes : null,
    notes: p.notes || "",
    solvedAt: new Date(p.solvedAt).toISOString(),
  };
}

function toApt(s: any): ClientAptitude {
  return {
    _id: String(s._id),
    category: s.category,
    topic: s.topic || "",
    attempted: s.attempted,
    correct: s.correct,
    minutes: typeof s.minutes === "number" ? s.minutes : null,
    notes: s.notes || "",
    sessionDate: new Date(s.sessionDate).toISOString(),
  };
}

export async function getCareerJobs() {
  const userId = await requireUser();
  await connectToDatabase();
  const jobs = await JobApplication.find({ userId }).sort({ updatedAt: -1 }).lean();
  return jobs.map(toJob);
}

export async function upsertJobAction(data: {
  id?: string;
  company: string;
  role: string;
  location?: string;
  jobUrl?: string;
  status: JobStatus;
  source?: string;
  appliedAt?: string;
  nextDate?: string;
  salary?: string;
  notes?: string;
}) {
  const userId = await requireUser();
  await connectToDatabase();
  if (!data.company?.trim() || !data.role?.trim()) {
    return { success: false, message: "Company and role are required." };
  }
  if (!JOB_STATUSES.includes(data.status)) {
    return { success: false, message: "Invalid status." };
  }

  const payload = {
    company: data.company.trim(),
    role: data.role.trim(),
    location: data.location?.trim() || "",
    jobUrl: data.jobUrl?.trim() || "",
    status: data.status,
    source: data.source?.trim() || "",
    appliedAt: atNoonIST(data.appliedAt),
    nextDate: atNoonIST(data.nextDate),
    salary: data.salary?.trim() || "",
    notes: data.notes?.trim() || "",
  };

  if (data.id) {
    await JobApplication.findOneAndUpdate({ _id: data.id, userId }, { $set: payload });
  } else {
    await JobApplication.create({ ...payload, userId });
  }
  revalidatePath("/career/jobs");
  return { success: true };
}

export async function updateJobStatusAction(id: string, status: JobStatus) {
  const userId = await requireUser();
  await connectToDatabase();
  await JobApplication.findOneAndUpdate({ _id: id, userId }, { $set: { status } });
  revalidatePath("/career/jobs");
  return { success: true };
}

export async function deleteJobAction(id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await JobApplication.deleteOne({ _id: id, userId });
  revalidatePath("/career/jobs");
  return { success: true };
}

export async function getDsaProblems() {
  const userId = await requireUser();
  await connectToDatabase();
  const items = await DsaProblem.find({ userId }).sort({ solvedAt: -1 }).lean();
  return items.map(toDsa);
}

export async function upsertDsaAction(data: {
  id?: string;
  title: string;
  url?: string;
  platform: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "Solved" | "Attempted" | "Revisit";
  minutes?: number;
  notes?: string;
  solvedAt?: string;
}) {
  const userId = await requireUser();
  await connectToDatabase();
  if (!data.title?.trim() || !data.topic) {
    return { success: false, message: "Title and topic are required." };
  }

  const payload = {
    title: data.title.trim(),
    url: data.url?.trim() || "",
    platform: data.platform || "LeetCode",
    topic: data.topic,
    difficulty: data.difficulty,
    status: data.status,
    minutes: data.minutes || undefined,
    notes: data.notes?.trim() || "",
    solvedAt: atNoonIST(data.solvedAt) || new Date(),
  };

  if (data.id) {
    await DsaProblem.findOneAndUpdate({ _id: data.id, userId }, { $set: payload });
  } else {
    await DsaProblem.create({ ...payload, userId });
  }
  revalidatePath("/career/dsa");
  return { success: true };
}

export async function deleteDsaAction(id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await DsaProblem.deleteOne({ _id: id, userId });
  revalidatePath("/career/dsa");
  return { success: true };
}

export async function getAptitudeSessions() {
  const userId = await requireUser();
  await connectToDatabase();
  const items = await AptitudeSession.find({ userId }).sort({ sessionDate: -1 }).lean();
  return items.map(toApt);
}

export async function upsertAptitudeAction(data: {
  id?: string;
  category: string;
  topic?: string;
  attempted: number;
  correct: number;
  minutes?: number;
  notes?: string;
  sessionDate?: string;
}) {
  const userId = await requireUser();
  await connectToDatabase();
  if (!APTITUDE_CATEGORIES.includes(data.category as any)) {
    return { success: false, message: "Pick a category." };
  }
  const attempted = Number(data.attempted);
  const correct = Number(data.correct);
  if (!Number.isFinite(attempted) || attempted < 1) {
    return { success: false, message: "Attempted must be at least 1." };
  }
  if (!Number.isFinite(correct) || correct < 0 || correct > attempted) {
    return { success: false, message: "Correct cannot exceed attempted." };
  }

  const payload = {
    category: data.category,
    topic: data.topic?.trim() || "",
    attempted,
    correct,
    minutes: data.minutes || undefined,
    notes: data.notes?.trim() || "",
    sessionDate: atNoonIST(data.sessionDate) || new Date(),
  };

  if (data.id) {
    await AptitudeSession.findOneAndUpdate({ _id: data.id, userId }, { $set: payload });
  } else {
    await AptitudeSession.create({ ...payload, userId });
  }
  revalidatePath("/career/aptitude");
  return { success: true };
}

export async function deleteAptitudeAction(id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await AptitudeSession.deleteOne({ _id: id, userId });
  revalidatePath("/career/aptitude");
  return { success: true };
}
