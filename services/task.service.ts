import connectToDatabase from "@/lib/db";
import Task from "@/models/Task";
import { toClientTask, type ClientTask } from "@/lib/serialize";
import { getStartOfTodayIST, getEndOfTodayIST } from "@/utils/date";

export async function getTasks(userId: string, filters: Record<string, unknown> = {}): Promise<ClientTask[]> {
  await connectToDatabase();
  const tasks = await Task.find({ userId, ...filters }).sort({ endDate: 1, dueDate: 1, priority: 1 }).lean();
  return tasks.map(toClientTask);
}

export async function getTodayMustDoTasks(userId: string): Promise<ClientTask[]> {
  await connectToDatabase();
  const startOfDay = getStartOfTodayIST();
  const endOfDay = getEndOfTodayIST();

  const tasks = await Task.find({
    userId,
    isMustDo: true,
    $or: [
      { status: { $ne: "Done" } },
      { endDate: { $gte: startOfDay, $lte: endOfDay } },
      { dueDate: { $gte: startOfDay, $lte: endOfDay } },
      { completedAt: { $gte: startOfDay, $lte: endOfDay } },
      { updatedAt: { $gte: startOfDay, $lte: endOfDay } },
    ],
  }).lean();

  // Done tasks last, then by priority
  const sorted = tasks.slice().sort((a, b) => {
    const aDone = a.status === "Done" ? 1 : 0;
    const bDone = b.status === "Done" ? 1 : 0;
    return aDone - bDone;
  });

  return sorted.map(toClientTask);
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
