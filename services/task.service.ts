import connectToDatabase from "@/lib/db";
import Task, { ITask } from "@/models/Task";
import mongoose from "mongoose";

export async function getTasks(userId: string, filters: any = {}): Promise<ITask[]> {
  await connectToDatabase();
  return Task.find({ userId, ...filters }).sort({ dueDate: 1, priority: 1 }).lean();
}

export async function getTodayMustDoTasks(userId: string): Promise<ITask[]> {
  await connectToDatabase();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return Task.find({
    userId,
    isMustDo: true,
    status: { $ne: "Done" },
    $or: [
      { dueDate: { $gte: startOfDay, $lte: endOfDay } },
      { dueDate: { $exists: false } }
    ]
  }).lean();
}

export async function createTask(userId: string, data: Partial<ITask>): Promise<ITask> {
  await connectToDatabase();
  
  if (data.isMustDo) {
    const mustDoCount = await Task.countDocuments({
      userId,
      isMustDo: true,
      status: { $ne: "Done" }
    });
    
    if (mustDoCount >= 3) {
      throw new Error("You already have 3 MUST DO tasks. Please complete or demote one first.");
    }
  }

  const task = new Task({ ...data, userId });
  return task.save();
}
