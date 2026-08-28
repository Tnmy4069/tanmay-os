"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocalAll } from "@/lib/offline/mutate";
import {
  getNotifyPrefs,
  runNotificationSweep,
  type ReminderTask,
} from "@/lib/notifications";

/**
 * Periodically checks local task data and sends browser/PWA notifications.
 * Also handles notification-click navigation from the service worker.
 */
export function NotificationBoot() {
  const router = useRouter();

  useEffect(() => {
    function handleNav(url: string) {
      if (url && typeof url === "string") {
        router.push(url);
      }
    }

    function onMessage(event: MessageEvent) {
      const data = event.data;
      if (data?.type === "NOTIFICATION_NAV" && typeof data.url === "string") {
        handleNav(data.url);
      }
    }

    navigator.serviceWorker?.addEventListener("message", onMessage);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("tanmay-os-notification");
      bc.onmessage = (event) => {
        const data = event.data;
        if (data?.type === "NOTIFICATION_NAV" && typeof data.url === "string") {
          handleNav(data.url);
        }
      };
    } catch {
      // ignore
    }

    return () => {
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      try {
        bc?.close();
      } catch {
        // ignore
      }
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function sweep() {
      if (cancelled) return;
      const prefs = getNotifyPrefs();
      if (!prefs.enabled) return;
      try {
        const tasks = await getLocalAll<ReminderTask>("tasks");
        await runNotificationSweep(tasks);
      } catch {
        // ignore
      }
    }

    // Wait for offline sync to warm IndexedDB, then poll while app is open
    const t0 = setTimeout(sweep, 5000);
    const t1 = setTimeout(sweep, 20000);
    const interval = setInterval(sweep, 5 * 60 * 1000);

    const onVisible = () => {
      if (document.visibilityState === "visible") sweep();
    };
    document.addEventListener("visibilitychange", onVisible);

    const onSynced = () => sweep();
    window.addEventListener("tanmay-os-synced", onSynced);

    return () => {
      cancelled = true;
      clearTimeout(t0);
      clearTimeout(t1);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("tanmay-os-synced", onSynced);
    };
  }, []);

  return null;
}
