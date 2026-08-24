import { auth } from "@/lib/auth";
import { CalendarCheck2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MonthlyChecklist } from "@/components/features/MonthlyChecklist";
import connectToDatabase from "@/lib/db";
import DailyCheckin from "@/models/DailyCheckin";

async function getMonthCheckins(userId: string, year: number, month: number) {
  await connectToDatabase();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const checkins = await DailyCheckin.find({
    userId,
    date: { $gte: start, $lt: end },
  }).lean();

  return checkins.map((c) => ({
    date: c.date.toISOString(),
    followedRoutine: c.followedRoutine,
  }));
}

export default async function ChecklistPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // IST now
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(Date.now() + istOffset);
  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth() + 1;

  const checkins = await getMonthCheckins(session.user.id, year, month);

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <CalendarCheck2 className="w-8 h-8 text-primary" />
          Monthly Routine Checklist
        </h1>
        <p className="text-muted-foreground">
          Track which days you followed your fixed daily routine. Click a past day to toggle it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Routine Follow Tracker</CardTitle>
          <CardDescription>
            Mark each day you consistently executed your planned routine schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyChecklist
            initialYear={year}
            initialMonth={month}
            initialCheckins={checkins}
          />
        </CardContent>
      </Card>
    </div>
  );
}
