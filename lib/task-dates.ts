import { formatInTimeZone } from "date-fns-tz";
import { TIMEZONE } from "@/utils/date";
import type { ClientTask } from "@/lib/serialize";

type TaskWithDates = Pick<ClientTask, "startDate" | "endDate" | "notifyDate" | "dueDate">;

/** Primary deadline for sorting / overdue — end date, then legacy due date. */
export function taskDeadline(task: TaskWithDates): string | null {
  return task.endDate || task.dueDate || null;
}

function dayKey(isoOrDate: string | Date): string {
  return formatInTimeZone(new Date(isoOrDate), TIMEZONE, "yyyy-MM-dd");
}

/** Calendar-day difference: positive = future, negative = past (IST). */
export function daysFromToday(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const today = dayKey(new Date());
  const day = dayKey(iso);
  const t0 = Date.parse(`${today}T12:00:00+05:30`);
  const t1 = Date.parse(`${day}T12:00:00+05:30`);
  return Math.round((t1 - t0) / 86_400_000);
}

/**
 * Simple relative day copy: today / tomorrow / yesterday / in 3 days / 2 days ago.
 * Farther dates fall back to a short absolute like "15 Mar".
 */
export function formatRelativeDay(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = daysFromToday(iso);
  if (diff === null) return "";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 1 && diff <= 6) return `in ${diff} days`;
  if (diff < -1 && diff >= -6) return `${Math.abs(diff)} days ago`;
  if (diff === 7) return "in a week";
  if (diff === -7) return "a week ago";

  const year = formatInTimeZone(new Date(iso), TIMEZONE, "yyyy");
  const thisYear = formatInTimeZone(new Date(), TIMEZONE, "yyyy");
  return formatInTimeZone(new Date(iso), TIMEZONE, year === thisYear ? "d MMM" : "d MMM yyyy");
}

/** @deprecated alias — prefer formatRelativeDay; kept so call sites stay simple. */
export function formatTaskDate(iso: string | null | undefined): string {
  return formatRelativeDay(iso);
}

export function formatStartsLabel(iso: string | null | undefined): string {
  const rel = formatRelativeDay(iso);
  if (!rel) return "";
  if (rel === "today") return "starts today";
  if (rel === "tomorrow") return "starts tomorrow";
  if (rel === "yesterday") return "started yesterday";
  if (rel.endsWith("ago")) return `started ${rel}`;
  return `starts ${rel}`;
}

export function formatDueLabel(iso: string | null | undefined): string {
  const rel = formatRelativeDay(iso);
  if (!rel) return "";
  if (rel === "today") return "due today";
  if (rel === "tomorrow") return "due tomorrow";
  if (rel === "yesterday") return "due yesterday";
  if (rel.endsWith("ago")) return `due ${rel}`;
  return `due ${rel}`;
}

export function formatRemindLabel(iso: string | null | undefined): string {
  const rel = formatRelativeDay(iso);
  if (!rel) return "";
  if (rel === "today") return "remind today";
  if (rel === "tomorrow") return "remind tomorrow";
  if (rel === "yesterday") return "reminded yesterday";
  if (rel.endsWith("ago")) return `reminded ${rel}`;
  return `remind ${rel}`;
}

export function isTaskDateToday(iso: string | null | undefined): boolean {
  return daysFromToday(iso) === 0;
}

export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return formatInTimeZone(new Date(iso), TIMEZONE, "yyyy-MM-dd");
}

export function isTaskOverdue(iso: string | null | undefined): boolean {
  const diff = daysFromToday(iso);
  return diff !== null && diff < 0;
}

export function parseDateInput(value: string): Date | undefined {
  if (!value) return undefined;
  return new Date(`${value}T12:00:00+05:30`);
}
