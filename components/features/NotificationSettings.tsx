"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  defaultNotifyPrefs,
  getNotifyPrefs,
  notificationPermission,
  requestNotificationPermission,
  setNotifyPrefs,
  showAppNotification,
  type NotifyPrefs,
} from "@/lib/notifications";

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotifyPrefs>(defaultNotifyPrefs);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setPrefs(getNotifyPrefs());
    setPerm(notificationPermission());
  }, []);

  function save(next: Partial<NotifyPrefs>) {
    const merged = setNotifyPrefs(next);
    setPrefs(merged);
  }

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const p = await requestNotificationPermission();
      setPerm(p);
      if (p !== "granted") {
        setMsg(p === "denied" ? "Permission blocked. Enable it in browser settings." : "Notifications not supported.");
        save({ enabled: false });
        return;
      }
      save({ enabled: true });
      await showAppNotification({
        title: "Notifications on ✓",
        body: "We'll nudge you for reminders, overdue tasks, and morning quests.",
        tag: "welcome-notify",
        url: "/today",
      });
      setMsg("Enabled. You'll get reminders on this device.");
    } finally {
      setBusy(false);
    }
  }

  function disable() {
    save({ enabled: false });
    setMsg("Notifications paused on this device.");
  }

  const Toggle = ({
    label,
    hint,
    checked,
    onChange,
    disabled,
  }: {
    label: string;
    hint: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
  }) => (
    <label
      className={`flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-extrabold">{label}</p>
        <p className="text-xs font-semibold text-muted-foreground">{hint}</p>
      </div>
      <input
        type="checkbox"
        className="h-5 w-5 accent-[color:var(--primary)]"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-border bg-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-sm)]">
            {prefs.enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-extrabold">Device reminders</p>
            <p className="text-xs font-semibold text-muted-foreground">
              Status: {perm === "granted" ? "allowed" : perm === "denied" ? "blocked" : perm}
            </p>
          </div>
        </div>
        {prefs.enabled && perm === "granted" ? (
          <Button variant="outline" onClick={disable} disabled={busy} className="w-full sm:w-auto">
            Turn off
          </Button>
        ) : (
          <Button onClick={enable} disabled={busy} className="w-full sm:w-auto">
            {busy ? "Requesting…" : "Enable notifications"}
          </Button>
        )}
      </div>

      <Toggle
        label="Morning quest"
        hint={`Around ${prefs.morningHour}:00 — start-the-day nudge`}
        checked={prefs.morningReminder}
        disabled={!prefs.enabled}
        onChange={(v) => save({ morningReminder: v })}
      />
      <Toggle
        label="Remind-day nudges"
        hint="When a task should remind you today"
        checked={prefs.taskNotifyDates}
        disabled={!prefs.enabled}
        onChange={(v) => save({ taskNotifyDates: v })}
      />
      <Toggle
        label="Overdue alert"
        hint="Once a day if anything was due yesterday or earlier"
        checked={prefs.overdueAlert}
        disabled={!prefs.enabled}
        onChange={(v) => save({ overdueAlert: v })}
      />

      {msg && (
        <p className="flex items-center gap-2 text-sm font-bold text-[color:var(--primary-deep)] dark:text-primary">
          <Check className="h-4 w-4" />
          {msg}
        </p>
      )}
      <p className="text-[11px] font-semibold text-muted-foreground">
        Works best when Tanmay OS is installed as a PWA. Keep the app opened at least once daily so reminders can fire.
      </p>
    </div>
  );
}
