import connectToDatabase from "@/lib/db";
import Task from "@/models/Task";
import { toClientTask, type ClientTask } from "@/lib/serialize";

export async function getTasks(userId: string, filters: Record<string, unknown> = {}): Promise<ClientTask[]> {
  await connectToDatabase();
  const tasks = await Task.find({ userId, ...filters }).sort({ dueDate: 1, priority: 1 }).lean();
  return tasks.map(toClientTask);
}

export async function getTodayMustDoTasks(userId: string): Promise<ClientTask[]> {
  await connectToDatabase();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const tasks = await Task.find({
    userId,
    isMustDo: true,
    status: { $ne: "Done" },
    $or: [
      { dueDate: { $gte: startOfDay, $lte: endOfDay } },
      { dueDate: { $exists: false } },
    ],
  }).lean();

  return tasks.map(toClientTask);
}

export async function createTask(userId: string, data: Record<string, unknown>) {
  await connectToDatabase();

  if (data.isMustDo) {
    const mustDoCount = await Task.countDocuments({
      userId,
      isMustDo: true,
      status: { $ne: "Done" },
    });

    if (mustDoCount >= 3) {
      throw new Error("You already have 3 MUST DO tasks. Please complete or demote one first.");
    }
  }

  const task = new Task({ ...data, userId });
  return task.save();
}
