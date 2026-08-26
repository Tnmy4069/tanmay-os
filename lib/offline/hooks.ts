"use client";

import { useEffect, useState, useCallback } from "react";
import { isOnline, subscribeOnline } from "@/lib/offline/network";
import { enqueueOutbox } from "@/lib/offline/outbox";
import { notifyOutboxChanged, subscribeSync, syncNow } from "@/lib/offline/sync";

export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(isOnline());
    return subscribeOnline(setOnline);
  }, []);

  return online;
}

export function useSyncStatus() {
  const [state, setState] = useState({
    syncing: false,
    pending: 0,
    lastError: null as string | null,
    pulledAt: null as string | null,
  });

  useEffect(() => subscribeSync(setState), []);

  return state;
}

/** Run a mutation online via server fn, or queue offline with optional local apply. */
export function useOfflineMutation() {
  const online = useOnlineStatus();

  const run = useCallback(
    async <T,>(opts: {
      action: string;
      payload: any;
      onlineFn: () => Promise<T>;
      offlineApply?: () => Promise<void> | void;
    }): Promise<{ result?: T; offline: boolean }> => {
      if (online) {
        const result = await opts.onlineFn();
        syncNow().catch(() => undefined);
        return { result, offline: false };
      }
      await opts.offlineApply?.();
      await enqueueOutbox(opts.action, opts.payload);
      notifyOutboxChanged();
      return { offline: true };
    },
    [online]
  );

  return { online, run };
}
