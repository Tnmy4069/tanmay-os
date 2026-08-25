import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalendarCheck2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MonthlyChecklist } from "@/components/features/MonthlyChecklist";
import connectToDatabase from "@/lib/db";
import DailyCheckin from "@/models/DailyCheckin";
import ScheduleBlock from "@/models/ScheduleBlock";

async function getRecentCheckins(userId: string) {
  await connectToDatabase();
  const start = new Date();
  start.setDate(start.getDate() - 150);

  const checkins = await DailyCheckin.find({
    userId,
    date: { $gte: start },
  }).lean();

  return checkins.map((c) => ({
    date: c.date.toISOString(),
    followedRoutine: c.followedRoutine,
    workLogs: (c.workLogs || []).map((log) => ({
      blockId: log.blockId,
      title: log.title,
      startTime: log.startTime,
      endTime: log.endTime,
      note: log.note,
    })),
  }));
}

async function getWorkBlocks(userId: string) {
  await connectToDatabase();
  const blocks = await ScheduleBlock.find({
    userId,
    type: { $in: ["Work", "Focus"] },
  }).sort({ startTime: 1 }).lean();
  return blocks.map((b) => ({
    _id: String(b._id),
    title: b.title,
    type: b.type,
    dayOfWeek: b.dayOfWeek,
    startTime: b.startTime,
    endTime: b.endTime,
  }));
}

export default async function ChecklistPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(Date.now() + istOffset);
  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth() + 1;

  const [checkins, workBlocks] = await Promise.all([
    getRecentCheckins(session.user.id),
    getWorkBlocks(session.user.id),
  ]);

  return (
    <div className="app-page max-w-3xl">
      <PageHeader
        title="Monthly checklist"
        description="Log Work and Focus slots. Streak counts days where every working slot has a note."
        icon={CalendarCheck2}
      />

      <Card>
        <CardHeader>
          <CardTitle>Work Block Tracker</CardTitle>
          <CardDescription>
            Click a day, write what you did in internship, focus, and other working slots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyChecklist
            initialYear={year}
            initialMonth={month}
            initialCheckins={checkins}
            workBlocks={workBlocks}
          />
        </CardContent>
      </Card>
    </div>
  );
}
