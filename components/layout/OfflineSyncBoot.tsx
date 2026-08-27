"use client";

import { useEffect } from "react";
import { subscribeOnline } from "@/lib/offline/network";
import { syncNow } from "@/lib/offline/sync";

/** Boots offline sync: pull/push when online, and again on reconnect. */
export function OfflineSyncBoot() {
  useEffect(() => {
    const run = () =>
      syncNow()
        .then(() => window.dispatchEvent(new Event("tanmay-os-synced")))
        .catch(() => undefined);

    run();

    const unsub = subscribeOnline((online) => {
      if (online) run();
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      unsub();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
