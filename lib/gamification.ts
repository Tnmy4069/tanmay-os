import type { ClientTask } from "@/lib/serialize";

const XP_PER_DONE = 25;
const XP_PER_MUST_DO = 40;
const DAILY_GOAL = 3;
const XP_PER_LEVEL = 100;

export function computeGameStats(opts: {
  allTasks: ClientTask[];
  mustDoTasks: ClientTask[];
  completedTodayCount?: number;
  /** ISO dates (yyyy-MM-dd) of days with at least one completion / check-in, newest first optional */
  activeDayKeys?: string[];
  todayKey: string;
}) {
  const { allTasks, mustDoTasks, todayKey } = opts;
  const doneTasks = allTasks.filter((t) => t.status === "Done");
  const openMust = mustDoTasks.filter((t) => t.status !== "Done");
  const doneMust = mustDoTasks.filter((t) => t.status === "Done");

  const xp =
    doneTasks.reduce((acc, t) => acc + (t.isMustDo ? XP_PER_MUST_DO : XP_PER_DONE), 0) +
    openMust.length * 5;

  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;

  const completedToday =
    opts.completedTodayCount ??
    doneMust.length +
      allTasks.filter((t) => {
        if (t.status !== "Done" || !t.updatedAt) return false;
        return t.updatedAt.slice(0, 10) === todayKey || (t as any).completedAt?.slice?.(0, 10) === todayKey;
      }).length;

  // Streak: consecutive days ending today if today is active, else ending yesterday
  const daySet = new Set(opts.activeDayKeys || []);
  if (completedToday > 0) daySet.add(todayKey);

  let streakDays = 0;
  const cursor = new Date(`${todayKey}T12:00:00+05:30`);
  // If today has no activity, start from yesterday
  if (!daySet.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  for (let i = 0; i < 400; i++) {
    const key = cursor.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    if (!daySet.has(key)) break;
    streakDays++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const dailyDone = Math.min(
    DAILY_GOAL,
    doneMust.length + Math.max(0, completedToday - doneMust.length)
  );

  const badges = [
    { id: "first-win", label: "First win", earned: doneTasks.length >= 1 },
    { id: "streak-3", label: "3-day streak", earned: streakDays >= 3 },
    { id: "streak-7", label: "Week warrior", earned: streakDays >= 7 },
    { id: "level-5", label: "Level 5", earned: level >= 5 },
    { id: "must-clear", label: "Must-do clear", earned: mustDoTasks.length > 0 && openMust.length === 0 },
    { id: "centurion", label: "100 XP", earned: xp >= 100 },
  ];

  return {
    streakDays,
    xp,
    level,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    dailyGoal: DAILY_GOAL,
    dailyDone: Math.max(dailyDone, Math.min(DAILY_GOAL, doneMust.length + (completedToday > 0 ? 1 : 0))),
    badges,
  };
}
