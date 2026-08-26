"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw, Check } from "lucide-react";
import { useOnlineStatus, useSyncStatus } from "@/lib/offline/hooks";
import { syncNow } from "@/lib/offline/sync";

export function OfflineBanner() {
  const online = useOnlineStatus();
  const { syncing, pending, lastError } = useSyncStatus();
  const [syncedFlash, setSyncedFlash] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
      setSyncedFlash(false);
      return;
    }
    if (wasOffline && !syncing && pending === 0) {
      setSyncedFlash(true);
      const t = setTimeout(() => {
        setSyncedFlash(false);
        setWasOffline(false);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [online, wasOffline, syncing, pending]);

  if (online && !syncing && pending === 0 && !syncedFlash && !lastError) return null;

  let message = "";
  let tone = "bg-amber-500/15 border-amber-500/30 text-amber-100";

  if (!online) {
    message =
      pending > 0
        ? `You are offline. ${pending} change${pending === 1 ? "" : "s"} will sync when you are back online.`
        : "You are offline. Changes will sync when you are back online.";
  } else if (syncing) {
    message = "Syncing…";
    tone = "bg-primary/15 border-primary/30 text-primary";
  } else if (lastError) {
    message = `Sync issue: ${lastError}. Tap to retry.`;
    tone = "bg-destructive/15 border-destructive/30 text-destructive";
  } else if (pending > 0) {
    message = `${pending} change${pending === 1 ? "" : "s"} waiting to sync.`;
    tone = "bg-amber-500/15 border-amber-500/30 text-amber-100";
  } else if (syncedFlash) {
    message = "All changes synced.";
    tone = "bg-emerald-500/15 border-emerald-500/30 text-emerald-200";
  }

  if (!message) return null;

  return (
    <>
      <div
        className={`fixed inset-x-0 top-0 z-[70] border-b px-3 py-2 text-center text-xs sm:text-sm ${tone}`}
        role="status"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          className="inline-flex items-center gap-2 font-medium"
          onClick={() => {
            if (online) syncNow().catch(() => undefined);
          }}
        >
          {!online ? (
            <CloudOff className="h-3.5 w-3.5" />
          ) : syncing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : syncedFlash ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {message}
        </button>
      </div>
      {/* Reserve space so content isn't covered by the sticky bar */}
      <div className="h-10 shrink-0" aria-hidden style={{ paddingTop: "env(safe-area-inset-top)" }} />
    </>
  );
}
