import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
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
    <div className="app-page max-w-5xl">
      <PageHeader
        title="Routine editor"
        description="Weekly fixed blocks. Tasks cannot overlap these unless override is allowed."
        icon={CalendarRange}
      />

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
