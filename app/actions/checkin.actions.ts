"use server";

import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import DailyCheckin, { type WorkLog } from "@/models/DailyCheckin";
import { revalidatePath } from "next/cache";

function toISTMidnight(date: Date): Date {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 5.5 * 60 * 60 * 1000);
}

export async function saveWorkLogsAction(dateStr: string, workLogs: WorkLog[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();

  const date = toISTMidnight(new Date(dateStr));
  const userId = session.user.id;

  const cleaned = workLogs.map((log) => ({
    blockId: String(log.blockId),
    title: log.title,
    startTime: log.startTime,
    endTime: log.endTime,
    note: (log.note || "").trim(),
  }));

  const followedRoutine = cleaned.length > 0 && cleaned.every((log) => log.note.length > 0);

  await DailyCheckin.findOneAndUpdate(
    { userId, date },
    { $set: { workLogs: cleaned, followedRoutine, notes: cleaned.map((l) => `${l.title}: ${l.note}`).join("\n") } },
    { upsert: true }
  );

  revalidatePath("/personal/checklist");
  revalidatePath("/today");
  return { success: true, followedRoutine };
}

export async function getMonthCheckins(year: number, month: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();

  const startOfMonth = toISTMidnight(new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+05:30`));
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endOfMonth = toISTMidnight(new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+05:30`));

  const checkins = await DailyCheckin.find({
    userId: session.user.id,
    date: { $gte: startOfMonth, $lt: endOfMonth },
  }).lean();

  return checkins.map((c) => ({
    date: c.date.toISOString(),
    followedRoutine: c.followedRoutine,
    notes: c.notes,
    workLogs: (c.workLogs || []).map((log) => ({
      blockId: log.blockId,
      title: log.title,
      startTime: log.startTime,
      endTime: log.endTime,
      note: log.note,
    })),
  }));
}

export async function getRecentCheckins(daysBack = 120) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();

  const start = toISTMidnight(new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000));

  const checkins = await DailyCheckin.find({
    userId: session.user.id,
    date: { $gte: start },
  }).lean();

  return checkins.map((c) => ({
    date: c.date.toISOString(),
    followedRoutine: c.followedRoutine,
    notes: c.notes,
    workLogs: (c.workLogs || []).map((log) => ({
      blockId: log.blockId,
      title: log.title,
      startTime: log.startTime,
      endTime: log.endTime,
      note: log.note,
    })),
  }));
}
