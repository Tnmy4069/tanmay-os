"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, X } from "lucide-react";
import { getNotifyPrefs, notificationPermission } from "@/lib/notifications";

const DISMISS_KEY = "tanmay-os-notify-nudge-dismissed";

/** Soft prompt to turn on reminders — Duolingo-style streak nudge. */
export function NotifyNudge() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
      const prefs = getNotifyPrefs();
      const perm = notificationPermission();
      if (prefs.enabled && perm === "granted") return;
      if (perm === "unsupported" || perm === "denied") return;
      setShow(true);
    } catch {
      // ignore
    }
  }, []);

  if (!show) return null;
  if (pathname?.startsWith("/login") || pathname?.startsWith("/register") || pathname?.startsWith("/settings")) {
    return null;
  }

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 z-[46] lg:hidden bottom-[calc(5.25rem+env(safe-area-inset-bottom))] px-3 pr-20">
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-2.5 rounded-2xl border-2 border-primary/40 bg-card px-3 py-2.5 shadow-[var(--shadow-md)]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-sm)]">
          <Bell className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold leading-tight">Keep your streak</p>
          <p className="text-[10px] font-semibold text-muted-foreground">Enable quest reminders</p>
        </div>
        <Link
          href="/settings"
          className="shrink-0 rounded-xl bg-primary px-2.5 py-1.5 text-[11px] font-extrabold text-primary-foreground shadow-[var(--shadow-sm)] active:translate-y-px"
          onClick={dismiss}
        >
          Enable
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-xl p-1.5 text-muted-foreground hover:bg-secondary"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
