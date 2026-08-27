/** Local / PWA notifications (no push server required). */

const PREF_KEY = "tanmay-os-notify-prefs";
const SENT_KEY = "tanmay-os-notify-sent";

export type NotifyPrefs = {
  enabled: boolean;
  morningReminder: boolean;
  morningHour: number; // 0-23 IST-ish via local clock
  taskNotifyDates: boolean;
  overdueAlert: boolean;
};

export const defaultNotifyPrefs: NotifyPrefs = {
  enabled: false,
  morningReminder: true,
  morningHour: 8,
  taskNotifyDates: true,
  overdueAlert: true,
};

export function getNotifyPrefs(): NotifyPrefs {
  if (typeof window === "undefined") return defaultNotifyPrefs;
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return defaultNotifyPrefs;
    return { ...defaultNotifyPrefs, ...JSON.parse(raw) };
  } catch {
    return defaultNotifyPrefs;
  }
}

export function setNotifyPrefs(prefs: Partial<NotifyPrefs>) {
  const next = { ...getNotifyPrefs(), ...prefs };
  localStorage.setItem(PREF_KEY, JSON.stringify(next));
  return next;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

function sentSet(): Set<string> {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markSent(id: string) {
  const s = sentSet();
  s.add(id);
  // Keep last ~80 ids
  const arr = [...s].slice(-80);
  localStorage.setItem(SENT_KEY, JSON.stringify(arr));
}

function alreadySent(id: string) {
  return sentSet().has(id);
}

export async function showAppNotification(opts: {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const tag = opts.tag || `tanmay-${Date.now()}`;
  const data = { url: opts.url || "/today" };

  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg?.showNotification) {
      await reg.showNotification(opts.title, {
        body: opts.body,
        tag,
        data,
        icon: "/pwa-icon/192",
        badge: "/pwa-icon/192",
      });
      return;
    }
  } catch {
    // fall through
  }

  // Fallback when SW not ready
  const n = new Notification(opts.title, { body: opts.body, tag, data: data as any, icon: "/pwa-icon/192" });
  n.onclick = () => {
    window.focus();
    if (opts.url) window.location.href = opts.url;
    n.close();
  };
}

export type ReminderTask = {
  _id: string;
  title: string;
  notifyDate?: string | null;
  endDate?: string | null;
  dueDate?: string | null;
  status?: string;
};

function todayKeyLocal() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function isSameIstDay(iso: string | null | undefined, key: string) {
  if (!iso) return false;
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === key;
}

function isBeforeToday(iso: string | null | undefined, key: string) {
  if (!iso) return false;
  const d = new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return d < key;
}

/** Scan tasks and fire due local notifications (deduped per day/tag). */
export async function runNotificationSweep(tasks: ReminderTask[]) {
  const prefs = getNotifyPrefs();
  if (!prefs.enabled || notificationPermission() !== "granted") return;

  const today = todayKeyLocal();
  const open = tasks.filter((t) => t.status !== "Done" && t.status !== "Cancelled");

  if (prefs.morningReminder) {
    const hour = new Date().getHours();
    const tag = `morning-${today}`;
    if (hour >= prefs.morningHour && hour < prefs.morningHour + 2 && !alreadySent(tag)) {
      const dueToday = open.filter((t) => {
        const end = t.endDate || t.dueDate;
        return isSameIstDay(end, today) || isSameIstDay(t.notifyDate, today);
      }).length;
      await showAppNotification({
        title: "Time to level up ⚡",
        body:
          dueToday > 0
            ? `You have ${dueToday} task${dueToday === 1 ? "" : "s"} on today's quest.`
            : "Open Tanmay OS and keep your streak alive.",
        tag,
        url: "/today",
      });
      markSent(tag);
    }
  }

  if (prefs.taskNotifyDates) {
    for (const t of open) {
      if (!isSameIstDay(t.notifyDate, today)) continue;
      const tag = `notify-${t._id}-${today}`;
      if (alreadySent(tag)) continue;
      await showAppNotification({
        title: "Reminder",
        body: t.title,
        tag,
        url: "/today",
      });
      markSent(tag);
    }
  }

  if (prefs.overdueAlert) {
    const overdue = open.filter((t) => isBeforeToday(t.endDate || t.dueDate, today));
    if (overdue.length > 0) {
      const tag = `overdue-${today}`;
      if (!alreadySent(tag)) {
        await showAppNotification({
          title: `${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}`,
          body: overdue
            .slice(0, 3)
            .map((t) => t.title)
            .join(" · "),
          tag,
          url: "/today",
        });
        markSent(tag);
      }
    }
  }
}
