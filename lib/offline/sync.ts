import { applySnapshot } from "@/lib/offline/db";
import { isOnline } from "@/lib/offline/network";
import { listOutbox, removeOutboxIds } from "@/lib/offline/outbox";
import type { SyncSnapshot } from "@/lib/sync/snapshot";

export type SyncState = "idle" | "syncing" | "error";

type SyncListener = (state: { syncing: boolean; pending: number; lastError: string | null; pulledAt: string | null }) => void;

let syncing = false;
let lastError: string | null = null;
let pulledAt: string | null = null;
const syncListeners = new Set<SyncListener>();

function emitSync() {
  listOutbox()
    .then((items) => {
      const pending = items.length;
      syncListeners.forEach((l) =>
        l({ syncing, pending, lastError, pulledAt })
      );
    })
    .catch(() => {
      syncListeners.forEach((l) => l({ syncing, pending: 0, lastError, pulledAt }));
    });
}

export function subscribeSync(listener: SyncListener) {
  syncListeners.add(listener);
  emitSync();
  return () => {
    syncListeners.delete(listener);
  };
}

export async function pullSnapshot(): Promise<SyncSnapshot | null> {
  if (!isOnline()) return null;
  const res = await fetch("/api/sync/snapshot", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to pull snapshot");
  const snapshot = (await res.json()) as SyncSnapshot;
  await applySnapshot(snapshot);
  pulledAt = snapshot.pulledAt;
  emitSync();
  return snapshot;
}

export async function pushOutbox() {
  if (!isOnline()) return { applied: [] as string[], failed: [] as { id: string; error: string }[] };
  const items = await listOutbox();
  if (!items.length) return { applied: [], failed: [] };

  const res = await fetch("/api/sync/push", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error("Failed to push outbox");
  const data = await res.json();
  if (data.applied?.length) await removeOutboxIds(data.applied);
  emitSync();
  return data as { applied: string[]; failed: { id: string; error: string }[] };
}

export async function syncNow() {
  if (!isOnline() || syncing) return;
  syncing = true;
  lastError = null;
  emitSync();
  try {
    await pushOutbox();
    await pullSnapshot();
  } catch (e: any) {
    lastError = e?.message || "Sync failed";
  } finally {
    syncing = false;
    emitSync();
  }
}

export function notifyOutboxChanged() {
  emitSync();
}
