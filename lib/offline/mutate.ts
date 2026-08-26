import { isOnline } from "@/lib/offline/network";
import { enqueueOutbox } from "@/lib/offline/outbox";
import { notifyOutboxChanged, syncNow } from "@/lib/offline/sync";
import { offlineDb } from "@/lib/offline/db";

/**
 * Prefer server when online; otherwise apply local change + queue for sync.
 */
export async function mutateWithOffline<T>(opts: {
  action: string;
  payload: any;
  onlineFn: () => Promise<T>;
  offlineApply?: () => Promise<void> | void;
}): Promise<{ result?: T; offline: boolean }> {
  if (isOnline()) {
    const result = await opts.onlineFn();
    syncNow().catch(() => undefined);
    return { result, offline: false };
  }
  await opts.offlineApply?.();
  await enqueueOutbox(opts.action, opts.payload);
  notifyOutboxChanged();
  return { offline: true };
}

export async function putLocal(table: keyof typeof offlineDb, row: any) {
  const t = (offlineDb as any)[table];
  if (t?.put) await t.put(row);
}

export async function deleteLocal(table: keyof typeof offlineDb, id: string) {
  const t = (offlineDb as any)[table];
  if (t?.delete) await t.delete(id);
}

export async function getLocalAll<T = any>(table: string): Promise<T[]> {
  const t = (offlineDb as any)[table];
  if (!t?.toArray) return [];
  return t.toArray();
}
