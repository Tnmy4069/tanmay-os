"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  defaultNotifyPrefs,
  getNotifyPrefs,
  notificationPermission,
  requestNotificationPermission,
  setNotifyPrefs,
  showAppNotification,
  type NotifyPrefs,
} from "@/lib/notifications";

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40",
        checked ? "bg-primary" : "bg-border"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-card shadow-sm transition-transform",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

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
        setMsg(p === "denied" ? "Blocked in browser settings." : "Not supported here.");
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
      setMsg("You're set. Reminders will land on this device.");
    } finally {
      setBusy(false);
    }
  }

  function disable() {
    save({ enabled: false });
    setMsg("Reminders paused.");
  }

  const on = prefs.enabled && perm === "granted";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3 rounded-3xl bg-primary/10 px-4 py-3.5">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          )}
        >
          {on ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold">{on ? "Reminders on" : "Reminders off"}</p>
          <p className="text-xs font-semibold text-muted-foreground">
            {perm === "granted" ? "Allowed" : perm === "denied" ? "Blocked" : "Needs permission"}
          </p>
        </div>
        {on ? (
          <Button variant="outline" size="sm" onClick={disable} disabled={busy}>
            Off
          </Button>
        ) : (
          <Button size="sm" onClick={enable} disabled={busy}>
            {busy ? "…" : "Enable"}
          </Button>
        )}
      </div>

      {(
        [
          {
            key: "morningReminder" as const,
            label: "Morning quest",
            hint: `Around ${prefs.morningHour}:00`,
          },
          {
            key: "taskNotifyDates" as const,
            label: "Remind-day nudges",
            hint: "When remind date is today",
          },
          {
            key: "overdueAlert" as const,
            label: "Overdue alert",
            hint: "Once a day if anything slipped",
          },
        ] as const
      ).map((row) => (
        <div
          key={row.key}
          className={cn(
            "flex items-center justify-between gap-3 rounded-3xl bg-secondary/80 px-4 py-3.5",
            !prefs.enabled && "opacity-50"
          )}
        >
          <div className="min-w-0">
            <p className="text-sm font-extrabold">{row.label}</p>
            <p className="text-xs font-semibold text-muted-foreground">{row.hint}</p>
          </div>
          <Switch
            checked={prefs[row.key]}
            disabled={!prefs.enabled}
            onChange={(v) => save({ [row.key]: v })}
          />
        </div>
      ))}

      {msg && (
        <p className="flex items-center gap-2 px-1 text-sm font-bold text-[color:var(--primary-deep)] dark:text-primary">
          <Check className="h-4 w-4" />
          {msg}
        </p>
      )}
      <p className="px-1 text-[11px] font-semibold text-muted-foreground">
        Best as an installed app. Open it once a day so nudges can fire.
      </p>
    </div>
  );
}
