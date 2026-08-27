import { formatInTimeZone } from "date-fns-tz";
import { TIMEZONE } from "@/utils/date";
import type { ClientTask } from "@/lib/serialize";

type TaskWithDates = Pick<ClientTask, "startDate" | "endDate" | "notifyDate" | "dueDate">;

/** Primary deadline for sorting / overdue — end date, then legacy due date. */
export function taskDeadline(task: TaskWithDates): string | null {
  return task.endDate || task.dueDate || null;
}

export function formatTaskDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return formatInTimeZone(new Date(iso), TIMEZONE, "d MMM");
}

export function isTaskDateToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const today = formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd");
  const day = formatInTimeZone(new Date(iso), TIMEZONE, "yyyy-MM-dd");
  return today === day;
}

export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return formatInTimeZone(new Date(iso), TIMEZONE, "yyyy-MM-dd");
}

export function isTaskOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const today = formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd");
  const day = formatInTimeZone(new Date(iso), TIMEZONE, "yyyy-MM-dd");
  return day < today;
}

export function parseDateInput(value: string): Date | undefined {
  if (!value) return undefined;
  return new Date(`${value}T12:00:00+05:30`);
}
