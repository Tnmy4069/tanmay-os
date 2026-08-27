"use server";

import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Task, { ITask } from "@/models/Task";
import ScheduleBlock from "@/models/ScheduleBlock";
import { revalidatePath } from "next/cache";
import { parseTimeToMinutes, getDayOfWeekIST } from "@/utils/date";

export async function checkTaskConflicts(userId: string, startTime: string, endTime: string, date: Date | string) {
  if (!startTime || !endTime) return null;

  await connectToDatabase();
  
  // Get day of week for the given date (default to today if none)
  const d = date ? new Date(date) : new Date();
  const dayOfWeek = d.getDay(); // Note: might need IST shift if edge case, but getDay() works for exact same day if instantiated properly

  const fixedBlocks = await ScheduleBlock.find({
    userId,
    isFixed: true,
    dayOfWeek
  }).lean();

  const taskStart = parseTimeToMinutes(startTime);
  const taskEnd = parseTimeToMinutes(endTime);

  for (const block of fixedBlocks) {
    if (!block.startTime || !block.endTime) continue;
    
    const blockStart = parseTimeToMinutes(block.startTime);
    const blockEnd = parseTimeToMinutes(block.endTime);

    // Overlap logic: 
    // Two intervals (A_start, A_end) and (B_start, B_end) overlap if:
    // A_start < B_end && B_start < A_end
    if (taskStart < blockEnd && blockStart < taskEnd) {
      return block.title; // Return the name of the conflicting block
    }
  }

  return null;
}

export async function getActiveMustDoCount(userId: string, date: Date | string) {
  await connectToDatabase();
  
  const d = date ? new Date(date) : new Date();
  d.setHours(0,0,0,0);
  const endD = new Date(d);
  endD.setHours(23,59,59,999);

  return Task.countDocuments({
    userId,
    isMustDo: true,
    status: { $nin: ["Done", "Cancelled"] },
    dueDate: { $gte: d, $lte: endD }
  });
}

function taskDayForQuery(data: Partial<ITask>, fallback?: Date) {
  const raw = data.endDate || data.dueDate || data.startDate || fallback;
  return raw ? new Date(raw) : new Date();
}

export async function createTaskAction(data: Partial<ITask>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const userId = session.user.id;
  await connectToDatabase();

  if (data.endDate && !data.dueDate) data.dueDate = data.endDate;
  if (!data.endDate && data.dueDate) data.endDate = data.dueDate;

  if (data.startDate && data.endDate) {
    const s = new Date(data.startDate).getTime();
    const e = new Date(data.endDate).getTime();
    if (!Number.isNaN(s) && !Number.isNaN(e) && e < s) {
      return { success: false, error: "DATE_ORDER", message: "Due date can’t be before start date." };
    }
  }

  const day = taskDayForQuery(data);

  if (data.isMustDo) {
    const count = await getActiveMustDoCount(userId, day);
    if (count >= 3) {
      return { success: false, error: "MUST_DO_LIMIT", message: "You already have 3 active MUST DO tasks for this day." };
    }
  }

  if (data.startTime && data.endTime && !data.overrideScheduleConflict) {
    const conflict = await checkTaskConflicts(userId, data.startTime, data.endTime, day);
    if (conflict) {
      return { success: false, error: "SCHEDULE_CONFLICT", message: `This task conflicts with fixed block: ${conflict}. Do you want to override?` };
    }
  }

  await Task.create({ ...data, userId });
  
  revalidatePath("/dashboard");
  revalidatePath("/today");
  revalidatePath("/tasks");
  
  return { success: true };
}

export async function updateTaskAction(taskId: string, data: Partial<ITask>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const userId = session.user.id;
  await connectToDatabase();

  const existingTask = await Task.findOne({ _id: taskId, userId });
  if (!existingTask) throw new Error("Task not found");

  if (data.isMustDo && !existingTask.isMustDo) {
    const count = await getActiveMustDoCount(
      userId,
      taskDayForQuery(data, existingTask.endDate || existingTask.dueDate || existingTask.startDate)
    );
    if (count >= 3) {
      return { success: false, error: "MUST_DO_LIMIT", message: "You already have 3 active MUST DO tasks for this day." };
    }
  }

  if (data.endDate && !data.dueDate) data.dueDate = data.endDate;
  if (!data.endDate && data.dueDate) data.endDate = data.dueDate;

  const nextStart = data.startDate ?? existingTask.startDate;
  const nextEnd = data.endDate ?? existingTask.endDate ?? existingTask.dueDate;
  if (nextStart && nextEnd) {
    const s = new Date(nextStart).getTime();
    const e = new Date(nextEnd).getTime();
    if (!Number.isNaN(s) && !Number.isNaN(e) && e < s) {
      return { success: false, error: "DATE_ORDER", message: "Due date can’t be before start date." };
    }
  }

  if (data.startTime && data.endTime && !data.overrideScheduleConflict) {
    const conflict = await checkTaskConflicts(
      userId,
      data.startTime,
      data.endTime,
      taskDayForQuery(data, existingTask.endDate || existingTask.dueDate || existingTask.startDate)
    );
    if (conflict) {
      return { success: false, error: "SCHEDULE_CONFLICT", message: `This task conflicts with fixed block: ${conflict}. Do you want to override?` };
    }
  }

  if (data.status === "Done" && existingTask.status !== "Done") {
    data.completedAt = new Date();
  }

  await Task.findOneAndUpdate({ _id: taskId, userId }, { $set: data });

  revalidatePath("/dashboard");
  revalidatePath("/today");
  revalidatePath("/tasks");

  return { success: true };
}

export async function deleteTaskAction(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  await connectToDatabase();
  await Task.deleteOne({ _id: taskId, userId: session.user.id });

  revalidatePath("/dashboard");
  revalidatePath("/today");
  revalidatePath("/tasks");

  return { success: true };
}

export async function toggleTaskStatusAction(taskId: string, status: "Not Started" | "Inbox" | "In Progress" | "Done" | "Cancelled") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  await connectToDatabase();
  const updateData: any = { status };
  
  if (status === "Done") {
    updateData.completedAt = new Date();
  } else {
    updateData.$unset = { completedAt: 1 };
  }

  await Task.findOneAndUpdate({ _id: taskId, userId: session.user.id }, updateData);

  revalidatePath("/dashboard");
  revalidatePath("/today");
  revalidatePath("/tasks");

  return { success: true };
}
