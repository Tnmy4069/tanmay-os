import connectToDatabase from "@/lib/db";
import Task from "@/models/Task";
import DailyCheckin from "@/models/DailyCheckin";
import JobApplication from "@/models/JobApplication";
import DsaProblem from "@/models/DsaProblem";
import IitmCourse from "@/models/IitmCourse";
import SkillCourse from "@/models/SkillCourse";
import ScheduleBlock from "@/models/ScheduleBlock";
import { toClientTask } from "@/lib/serialize";
import { taskDeadline } from "@/lib/task-dates";
import { formatIST, getStartOfTodayIST, parseTimeToMinutes, TIMEZONE } from "@/utils/date";
import { formatInTimeZone, toDate } from "date-fns-tz";

function dayKey(d: Date) {
  return formatInTimeZone(d, TIMEZONE, "yyyy-MM-dd");
}

function lastNDayKeys(n: number) {
  const keys: string[] = [];
  const start = getStartOfTodayIST();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(start.getTime() - i * 86400000);
    keys.push(dayKey(d));
  }
  return keys;
}

export async function getAnalyticsSnapshot(userId: string) {
  await connectToDatabase();
  const startOfToday = getStartOfTodayIST();
  const weekAgo = new Date(startOfToday.getTime() - 6 * 86400000);
  const monthAgo = new Date(startOfToday.getTime() - 29 * 86400000);

  const [tasks, checkins, jobs, dsa, iitm, skills, schedule] = await Promise.all([
    Task.find({ userId }).lean(),
    DailyCheckin.find({ userId, date: { $gte: monthAgo } }).lean(),
    JobApplication.find({ userId }).lean(),
    DsaProblem.find({ userId }).lean(),
    IitmCourse.find({ userId }).lean(),
    SkillCourse.find({ userId }).lean(),
    ScheduleBlock.find({ userId }).lean(),
  ]);

  const clientTasks = tasks.map(toClientTask);
  const open = clientTasks.filter((t) => t.status !== "Done" && t.status !== "Cancelled");
  const done = clientTasks.filter((t) => t.status === "Done");
  const completionRate = clientTasks.length
    ? Math.round((done.length / clientTasks.filter((t) => t.status !== "Cancelled").length) * 100)
    : 0;

  const dayKeys7 = lastNDayKeys(7);
  const completionsByDay = dayKeys7.map((key) => {
    const count = done.filter((t) => {
      if (!t.updatedAt) return false;
      return dayKey(new Date(t.updatedAt)) === key;
    }).length;
    const label = formatIST(toDate(`${key}T12:00:00`, { timeZone: TIMEZONE }), "EEE");
    return { day: label, key, completed: count };
  });

  const doneThisWeek = completionsByDay.reduce((a, d) => a + d.completed, 0);

  const byCategory: Record<string, number> = {};
  open.forEach((t) => {
    const cat = t.category || "General";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });
  const categoryBreakdown = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const byPriority: Record<string, number> = {};
  open.forEach((t) => {
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
  });
  const priorityBreakdown = ["P0 Critical", "P1 High", "P2 Medium", "P3 Low"].map((name) => ({
    name: name.replace(/^P\d\s/, ""),
    value: byPriority[name] || 0,
  }));

  // Focus hours from routine: average Work+Focus minutes per day * days with checkins this week
  const focusMinutesPerDay = [0, 1, 2, 3, 4, 5, 6].map((dow) => {
    return schedule
      .filter((b: any) => b.dayOfWeek === dow && (b.type === "Work" || b.type === "Focus"))
      .reduce((acc: number, b: any) => {
        let start = parseTimeToMinutes(b.startTime);
        let end = parseTimeToMinutes(b.endTime);
        if (end <= start) end += 24 * 60;
        return acc + (end - start);
      }, 0);
  });
  const avgFocusMin = focusMinutesPerDay.reduce((a, b) => a + b, 0) / 7;
  const focusHoursWeek = Math.round(((avgFocusMin * 7) / 60) * 10) / 10;

  const checkinsThisWeek = checkins.filter((c: any) => new Date(c.date) >= weekAgo).length;
  const loggedSlots = checkins.reduce((acc: number, c: any) => acc + (c.workLogs?.length || 0), 0);

  const overdue = open.filter((t) => {
    const d = taskDeadline(t);
    return d && new Date(d) < startOfToday;
  }).length;

  const jobsByStatus: Record<string, number> = {};
  jobs.forEach((j: any) => {
    jobsByStatus[j.status] = (jobsByStatus[j.status] || 0) + 1;
  });

  const dsaSolved = dsa.filter((p: any) => p.status === "Solved").length;
  const iitmActive = iitm.filter((c: any) => c.status === "In Progress").length;
  const skillsActive = skills.filter((c: any) => c.status === "In Progress").length;

  return {
    summary: {
      openTasks: open.length,
      doneTasks: done.length,
      completionRate,
      overdue,
      doneThisWeek,
      focusHoursWeek,
      checkinsThisWeek,
      loggedSlots,
    },
    completionsByDay,
    categoryBreakdown,
    priorityBreakdown,
    career: {
      totalJobs: jobs.length,
      jobsByStatus: Object.entries(jobsByStatus).map(([name, value]) => ({ name, value })),
      dsaSolved,
      dsaTotal: dsa.length,
    },
    education: {
      iitmActive,
      iitmTotal: iitm.length,
      skillsActive,
      skillsTotal: skills.length,
    },
  };
}

export type AnalyticsSnapshot = Awaited<ReturnType<typeof getAnalyticsSnapshot>>;
