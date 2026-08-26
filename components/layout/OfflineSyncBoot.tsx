"use client";

import { useEffect } from "react";
import { subscribeOnline } from "@/lib/offline/network";
import { syncNow } from "@/lib/offline/sync";

/** Boots offline sync: pull/push when online, and again on reconnect. */
export function OfflineSyncBoot() {
  useEffect(() => {
    syncNow().catch(() => undefined);

    const unsub = subscribeOnline((online) => {
      if (online) syncNow().catch(() => undefined);
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") syncNow().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      unsub();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
