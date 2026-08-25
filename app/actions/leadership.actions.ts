"use server";

import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import LeadershipEvent from "@/models/LeadershipEvent";
import LeadershipTask from "@/models/LeadershipTask";
import LeadershipMember from "@/models/LeadershipMember";
import CtfChallenge from "@/models/CtfChallenge";
import {
  CTF_RESULTS,
  LEADERSHIP_CLUBS,
  LEADERSHIP_EVENT_STATUSES,
  LEADERSHIP_EVENT_TYPES,
  LEADERSHIP_TASK_STATUSES,
  type CtfResult,
  type LeadershipClub,
  type LeadershipEventStatus,
  type LeadershipEventType,
  type LeadershipTaskStatus,
} from "@/lib/leadership-constants";
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

function clubPath(club: LeadershipClub) {
  return club === "Apthex" ? "/leadership/apthex" : "/leadership/cyberx";
}

export type ClientLeadEvent = {
  _id: string;
  title: string;
  type: LeadershipEventType;
  eventDate: string;
  location: string;
  status: LeadershipEventStatus;
  notes: string;
};

export type ClientLeadTask = {
  _id: string;
  title: string;
  owner: string;
  status: LeadershipTaskStatus;
  dueDate: string | null;
  notes: string;
};

export type ClientLeadMember = {
  _id: string;
  name: string;
  role: string;
  contact: string;
  notes: string;
};

export type ClientCtf = {
  _id: string;
  title: string;
  category: string;
  platform: string;
  result: CtfResult;
  eventDate: string;
  notes: string;
};

export async function getLeadershipData(club: LeadershipClub) {
  const userId = await requireUser();
  await connectToDatabase();
  const [events, tasks, members, ctfs] = await Promise.all([
    LeadershipEvent.find({ userId, club }).sort({ eventDate: 1 }).lean(),
    LeadershipTask.find({ userId, club }).sort({ updatedAt: -1 }).lean(),
    LeadershipMember.find({ userId, club }).sort({ name: 1 }).lean(),
    club === "CyberX" ? CtfChallenge.find({ userId }).sort({ eventDate: -1 }).lean() : Promise.resolve([]),
  ]);
  return {
    events: events.map((e) => ({
      _id: String(e._id),
      title: e.title,
      type: e.type,
      eventDate: new Date(e.eventDate).toISOString(),
      location: e.location || "",
      status: e.status,
      notes: e.notes || "",
    })) as ClientLeadEvent[],
    tasks: tasks.map((t) => ({
      _id: String(t._id),
      title: t.title,
      owner: t.owner || "",
      status: t.status,
      dueDate: iso(t.dueDate),
      notes: t.notes || "",
    })) as ClientLeadTask[],
    members: members.map((m) => ({
      _id: String(m._id),
      name: m.name,
      role: m.role,
      contact: m.contact || "",
      notes: m.notes || "",
    })) as ClientLeadMember[],
    ctfs: ctfs.map((c: any) => ({
      _id: String(c._id),
      title: c.title,
      category: c.category || "",
      platform: c.platform || "",
      result: c.result,
      eventDate: new Date(c.eventDate).toISOString(),
      notes: c.notes || "",
    })) as ClientCtf[],
  };
}

export async function upsertLeadEventAction(data: {
  club: LeadershipClub;
  id?: string;
  title: string;
  type: LeadershipEventType;
  eventDate: string;
  location?: string;
  status: LeadershipEventStatus;
  notes?: string;
}) {
  const userId = await requireUser();
  await connectToDatabase();
  if (!LEADERSHIP_CLUBS.includes(data.club) || !data.title?.trim() || !data.eventDate) {
    return { success: false, message: "Club, title, and date are required." };
  }
  if (!LEADERSHIP_EVENT_TYPES.includes(data.type) || !LEADERSHIP_EVENT_STATUSES.includes(data.status)) {
    return { success: false, message: "Invalid type or status." };
  }
  const payload = {
    club: data.club,
    title: data.title.trim(),
    type: data.type,
    eventDate: atNoonIST(data.eventDate),
    location: data.location?.trim() || "",
    status: data.status,
    notes: data.notes?.trim() || "",
  };
  if (data.id) await LeadershipEvent.findOneAndUpdate({ _id: data.id, userId, club: data.club }, { $set: payload });
  else await LeadershipEvent.create({ ...payload, userId });
  revalidatePath(clubPath(data.club));
  return { success: true };
}

export async function deleteLeadEventAction(club: LeadershipClub, id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await LeadershipEvent.deleteOne({ _id: id, userId, club });
  revalidatePath(clubPath(club));
  return { success: true };
}

export async function upsertLeadTaskAction(data: {
  club: LeadershipClub;
  id?: string;
  title: string;
  owner?: string;
  status: LeadershipTaskStatus;
  dueDate?: string;
  notes?: string;
}) {
  const userId = await requireUser();
  await connectToDatabase();
  if (!data.title?.trim()) return { success: false, message: "Title is required." };
  if (!LEADERSHIP_TASK_STATUSES.includes(data.status)) return { success: false, message: "Invalid status." };
  const payload = {
    club: data.club,
    title: data.title.trim(),
    owner: data.owner?.trim() || "",
    status: data.status,
    dueDate: atNoonIST(data.dueDate),
    notes: data.notes?.trim() || "",
  };
  if (data.id) await LeadershipTask.findOneAndUpdate({ _id: data.id, userId, club: data.club }, { $set: payload });
  else await LeadershipTask.create({ ...payload, userId });
  revalidatePath(clubPath(data.club));
  return { success: true };
}

export async function updateLeadTaskStatusAction(club: LeadershipClub, id: string, status: LeadershipTaskStatus) {
  const userId = await requireUser();
  await connectToDatabase();
  await LeadershipTask.findOneAndUpdate({ _id: id, userId, club }, { $set: { status } });
  revalidatePath(clubPath(club));
  return { success: true };
}

export async function deleteLeadTaskAction(club: LeadershipClub, id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await LeadershipTask.deleteOne({ _id: id, userId, club });
  revalidatePath(clubPath(club));
  return { success: true };
}

export async function upsertLeadMemberAction(data: {
  club: LeadershipClub;
  id?: string;
  name: string;
  role: string;
  contact?: string;
  notes?: string;
}) {
  const userId = await requireUser();
  await connectToDatabase();
  if (!data.name?.trim() || !data.role?.trim()) return { success: false, message: "Name and role are required." };
  const payload = {
    club: data.club,
    name: data.name.trim(),
    role: data.role.trim(),
    contact: data.contact?.trim() || "",
    notes: data.notes?.trim() || "",
  };
  if (data.id) await LeadershipMember.findOneAndUpdate({ _id: data.id, userId, club: data.club }, { $set: payload });
  else await LeadershipMember.create({ ...payload, userId });
  revalidatePath(clubPath(data.club));
  return { success: true };
}

export async function deleteLeadMemberAction(club: LeadershipClub, id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await LeadershipMember.deleteOne({ _id: id, userId, club });
  revalidatePath(clubPath(club));
  return { success: true };
}

export async function upsertCtfAction(data: {
  id?: string;
  title: string;
  category?: string;
  platform?: string;
  result: CtfResult;
  eventDate: string;
  notes?: string;
}) {
  const userId = await requireUser();
  await connectToDatabase();
  if (!data.title?.trim() || !data.eventDate) return { success: false, message: "Title and date are required." };
  if (!CTF_RESULTS.includes(data.result)) return { success: false, message: "Invalid result." };
  const payload = {
    title: data.title.trim(),
    category: data.category?.trim() || "",
    platform: data.platform?.trim() || "",
    result: data.result,
    eventDate: atNoonIST(data.eventDate),
    notes: data.notes?.trim() || "",
  };
  if (data.id) await CtfChallenge.findOneAndUpdate({ _id: data.id, userId }, { $set: payload });
  else await CtfChallenge.create({ ...payload, userId });
  revalidatePath("/leadership/cyberx");
  return { success: true };
}

export async function deleteCtfAction(id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await CtfChallenge.deleteOne({ _id: id, userId });
  revalidatePath("/leadership/cyberx");
  return { success: true };
}
