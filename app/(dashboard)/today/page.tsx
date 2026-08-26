import { auth } from "@/lib/auth";
import { getTasks } from "@/services/task.service";
import { getScheduleForDay } from "@/services/schedule.service";
import { calculateWorkload } from "@/utils/workload";
import { formatIST, getDayOfWeekIST, getStartOfTodayIST, getEndOfTodayIST } from "@/utils/date";
import connectToDatabase from "@/lib/db";
import DailyCheckin from "@/models/DailyCheckin";
import { TodayView } from "@/components/features/TodayView";

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const startOfDay = getStartOfTodayIST();
  const endOfDay = getEndOfTodayIST();
  const dateStr = formatIST(new Date(), "yyyy-MM-dd");
  const dayOfWeek = getDayOfWeekIST();

  const [todaySchedule, openTasks, todayCheckin] = await Promise.all([
    getScheduleForDay(userId, dayOfWeek),
    getTasks(userId, { status: { $nin: ["Done", "Cancelled"] } }),
    (async () => {
      await connectToDatabase();
      return DailyCheckin.findOne({
        userId,
        date: { $gte: startOfDay, $lte: endOfDay },
      }).lean();
    })(),
  ]);

  const overdueTasks = openTasks.filter((t) => t.dueDate && new Date(t.dueDate) < startOfDay);
  const dueToday = openTasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d >= startOfDay && d <= endOfDay;
  });
  const unscheduled = openTasks.filter((t) => !t.dueDate && !t.isMustDo);

  const mustDoTasks = openTasks.filter((t) => t.isMustDo);
  const shouldDoTasks = dueToday.filter(
    (t) => !t.isMustDo && (t.priority === "P0 Critical" || t.priority === "P1 High" || t.priority === "P2 Medium")
  );
  const couldDoTasks = dueToday.filter((t) => !t.isMustDo && t.priority === "P3 Low");

  const plannedForCapacity = [...mustDoTasks, ...dueToday];
  const workload = calculateWorkload(todaySchedule, plannedForCapacity);

  const blocks = todaySchedule.map((b) => ({
    _id: String(b._id),
    title: b.title,
    type: b.type,
    startTime: b.startTime,
    endTime: b.endTime,
  }));

  const workLogs = (todayCheckin?.workLogs || []).map((log) => ({
    blockId: log.blockId,
    title: log.title,
    startTime: log.startTime,
    endTime: log.endTime,
    note: log.note,
  }));

  return (
    <TodayView
      dateLabel={formatIST(new Date(), "EEEE, MMMM d")}
      dateStr={dateStr}
      userName={session.user.name?.split(" ")[0] || "Tanmay"}
      blocks={blocks}
      workLogs={workLogs}
      workload={{
        availableMinutes: workload.availableMinutes,
        plannedMinutes: workload.plannedMinutes,
        isOverloaded: workload.isOverloaded,
      }}
      overdueTasks={overdueTasks}
      mustDoTasks={mustDoTasks}
      shouldDoTasks={shouldDoTasks}
      couldDoTasks={couldDoTasks}
      backlogTasks={unscheduled}
    />
  );
}
