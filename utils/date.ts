import { format, parse, startOfDay, endOfDay, isAfter, isBefore, isEqual, parseISO } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";

export const TIMEZONE = "Asia/Kolkata";

/**
 * Returns the current date/time in the user's timezone as a Date object.
 */
export function getNow(): Date {
  // Creating a new date in local machine's timezone, then shifting it to IST conceptually
  // To avoid complex timezone math for simple apps, a robust way is to just keep track of UTC
  // but format it with date-fns-tz. However, since the prompt specifies strict Asia/Kolkata handling
  // for all daily schedules, we will use date-fns-tz for precise calculations.
  return new Date();
}

/**
 * Returns the start of the day in IST
 */
export function getStartOfTodayIST(): Date {
  const now = new Date();
  const dateString = formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd");
  return toDate(`${dateString}T00:00:00`, { timeZone: TIMEZONE });
}

/**
 * Returns the end of the day in IST
 */
export function getEndOfTodayIST(): Date {
  const now = new Date();
  const dateString = formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd");
  return toDate(`${dateString}T23:59:59.999`, { timeZone: TIMEZONE });
}

/**
 * Gets the current day of the week in IST (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeekIST(): number {
  const now = new Date();
  const dateString = formatInTimeZone(now, TIMEZONE, "i"); // 1=Mon, 7=Sun
  const day = parseInt(dateString, 10);
  return day === 7 ? 0 : day;
}

/**
 * Formats a Date object specifically in IST
 */
export function formatIST(date: Date, formatStr: string): string {
  return formatInTimeZone(date, TIMEZONE, formatStr);
}

/**
 * Parses "HH:mm" to minutes since midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours * 60) + minutes;
}
