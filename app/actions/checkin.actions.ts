"use server";

import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import DailyCheckin from "@/models/DailyCheckin";
import { revalidatePath } from "next/cache";

function toISTMidnight(date: Date): Date {
  // Convert to IST (UTC+5:30) and return midnight of that day in UTC
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 5.5 * 60 * 60 * 1000);
}

export async function toggleCheckinAction(dateStr: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();

  const date = toISTMidnight(new Date(dateStr));
  const userId = session.user.id;

  const existing = await DailyCheckin.findOne({ userId, date });
  if (existing) {
    await DailyCheckin.findOneAndUpdate(
      { userId, date },
      { $set: { followedRoutine: !existing.followedRoutine } }
    );
  } else {
    await DailyCheckin.create({ userId, date, followedRoutine: true });
  }

  revalidatePath("/personal/checklist");
  return { success: true };
}

export async function getMonthCheckins(year: number, month: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();

  const startOfMonth = toISTMidnight(new Date(year, month - 1, 1));
  const endOfMonth = toISTMidnight(new Date(year, month, 0));
  endOfMonth.setDate(endOfMonth.getDate() + 1);

  const checkins = await DailyCheckin.find({
    userId: session.user.id,
    date: { $gte: startOfMonth, $lt: endOfMonth },
  }).lean();

  return checkins.map((c) => ({
    date: c.date.toISOString(),
    followedRoutine: c.followedRoutine,
    notes: c.notes,
  }));
}
