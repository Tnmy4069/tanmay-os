import { auth } from "@/lib/auth";
import { CalendarRange } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RoutineEditor } from "@/components/features/RoutineEditor";
import connectToDatabase from "@/lib/db";
import ScheduleBlock from "@/models/ScheduleBlock";

async function getAllBlocks(userId: string) {
  await connectToDatabase();
  const blocks = await ScheduleBlock.find({ userId }).sort({ dayOfWeek: 1, startTime: 1 }).lean();
  return blocks.map((b) => ({
    _id: String(b._id),
    title: b.title,
    dayOfWeek: b.dayOfWeek,
    startTime: b.startTime,
    endTime: b.endTime,
    type: b.type,
    isFixed: b.isFixed,
    allowOverride: b.allowOverride,
  }));
}

export default async function RoutineEditorPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const blocks = await getAllBlocks(session.user.id);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <CalendarRange className="w-8 h-8 text-primary" />
          Routine Editor
        </h1>
        <p className="text-muted-foreground">
          Define your weekly fixed schedule blocks. These blocks are used for conflict detection when creating tasks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule Blocks</CardTitle>
          <CardDescription>
            Select a day, then add or edit time blocks. Fixed blocks cannot be overridden by tasks unless explicitly allowed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoutineEditor initialBlocks={blocks} />
        </CardContent>
      </Card>
    </div>
  );
}
