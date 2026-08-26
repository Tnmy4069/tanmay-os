import { offlineDb, type OutboxRow } from "@/lib/offline/db";

export async function enqueueOutbox(action: string, payload: any): Promise<OutboxRow> {
  const row: OutboxRow = {
    id: crypto.randomUUID(),
    action,
    payload,
    createdAt: new Date().toISOString(),
  };
  await offlineDb.outbox.put(row);
  return row;
}

export async function listOutbox(): Promise<OutboxRow[]> {
  return offlineDb.outbox.orderBy("createdAt").toArray();
}

export async function removeOutboxIds(ids: string[]) {
  if (!ids.length) return;
  await offlineDb.outbox.bulkDelete(ids);
}

export async function outboxCount() {
  return offlineDb.outbox.count();
}
