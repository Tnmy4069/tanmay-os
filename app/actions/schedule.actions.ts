"use server";

import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import ScheduleBlock, { IScheduleBlock } from "@/models/ScheduleBlock";
import { revalidatePath } from "next/cache";

export type BlockFormData = {
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: string;
  isFixed: boolean;
  allowOverride: boolean;
};

export async function createScheduleBlockAction(data: BlockFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();

  // Check for exact overlap on same day
  const overlap = await ScheduleBlock.findOne({
    userId: session.user.id,
    dayOfWeek: data.dayOfWeek,
    $or: [
      { startTime: { $lt: data.endTime }, endTime: { $gt: data.startTime } },
    ],
  });

  if (overlap) {
    return {
      success: false,
      error: "TIME_OVERLAP",
      message: `This block overlaps with "${overlap.title}" (${overlap.startTime}–${overlap.endTime}).`,
    };
  }

  await ScheduleBlock.create({
    ...data,
    userId: session.user.id,
    type: data.type as IScheduleBlock["type"],
  });
  revalidatePath("/settings/routine");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateScheduleBlockAction(blockId: string, data: Partial<BlockFormData>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();

  const existing = await ScheduleBlock.findOne({ _id: blockId, userId: session.user.id });
  if (!existing) throw new Error("Block not found");

  // Check overlap excluding self
  if (data.startTime && data.endTime) {
    const overlap = await ScheduleBlock.findOne({
      userId: session.user.id,
      dayOfWeek: data.dayOfWeek ?? existing.dayOfWeek,
      _id: { $ne: blockId },
      $or: [{ startTime: { $lt: data.endTime }, endTime: { $gt: data.startTime } }],
    });
    if (overlap) {
      return {
        success: false,
        error: "TIME_OVERLAP",
        message: `This block overlaps with "${overlap.title}" (${overlap.startTime}–${overlap.endTime}).`,
      };
    }
  }

  await ScheduleBlock.findOneAndUpdate({ _id: blockId, userId: session.user.id }, { $set: data });
  revalidatePath("/settings/routine");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteScheduleBlockAction(blockId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();
  await ScheduleBlock.deleteOne({ _id: blockId, userId: session.user.id });
  revalidatePath("/settings/routine");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  return { success: true };
}
