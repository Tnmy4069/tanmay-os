import connectToDatabase from "@/lib/db";
import ScheduleBlock, { IScheduleBlock } from "@/models/ScheduleBlock";

export async function getScheduleForDay(userId: string, dayOfWeek: number): Promise<IScheduleBlock[]> {
  await connectToDatabase();
  return ScheduleBlock.find({ userId, dayOfWeek }).sort({ startTime: 1 }).lean();
}

export async function checkScheduleConflict(userId: string, dayOfWeek: number, startTime: string, endTime: string): Promise<IScheduleBlock | null> {
  await connectToDatabase();
  
  // Simple time string comparison works if times are HH:MM in 24h format
  const conflict = await ScheduleBlock.findOne({
    userId,
    dayOfWeek,
    isFixed: true,
    $or: [
      {
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gt: startTime } }
        ]
      }
    ]
  }).lean();

  return conflict as IScheduleBlock | null;
}
