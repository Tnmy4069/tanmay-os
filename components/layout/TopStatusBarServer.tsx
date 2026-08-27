import { auth } from "@/lib/auth";
import { getTasks, getTodayMustDoTasks } from "@/services/task.service";
import { getScheduleForDay } from "@/services/schedule.service";
import { computeGameStats } from "@/lib/gamification";
import { getDayOfWeekIST, TIMEZONE } from "@/utils/date";
import { formatInTimeZone } from "date-fns-tz";
import { TopStatusBar } from "@/components/layout/TopStatusBar";

/** Loads summary metrics for the sticky top status bar. */
export async function TopStatusBarServer() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const todayKey = formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd");

  const [openTasks, mustDoTasks, doneTasks, schedule] = await Promise.all([
    getTasks(userId, { status: { $ne: "Done" } }),
    getTodayMustDoTasks(userId),
    getTasks(userId, { status: "Done" }),
    getScheduleForDay(userId, getDayOfWeekIST()),
  ]);

  const pendingCount = openTasks.filter((t) => t.status !== "Cancelled").length;
  const game = computeGameStats({
    allTasks: [...openTasks, ...doneTasks],
    mustDoTasks,
    todayKey,
    activeDayKeys: doneTasks
      .map((t) => (t.updatedAt ? formatInTimeZone(new Date(t.updatedAt), TIMEZONE, "yyyy-MM-dd") : null))
      .filter(Boolean) as string[],
  });

  const slots = schedule.map((b) => ({
    title: String(b.title || ""),
    startTime: String(b.startTime || ""),
    endTime: String(b.endTime || ""),
    type: String(b.type || ""),
  }));

  return (
    <TopStatusBar pendingCount={pendingCount} streakDays={game.streakDays} slots={slots} />
  );
}
