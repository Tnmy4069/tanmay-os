import Dexie, { type Table } from "dexie";
import type { SyncSnapshot } from "@/lib/sync/snapshot";

export type OutboxRow = {
  id: string;
  action: string;
  payload: any;
  createdAt: string;
};

export type MetaRow = {
  key: string;
  value: any;
};

class OfflineDB extends Dexie {
  tasks!: Table<any, string>;
  schedule!: Table<any, string>;
  checkins!: Table<any, string>;
  jobs!: Table<any, string>;
  dsa!: Table<any, string>;
  aptitude!: Table<any, string>;
  iitmCourses!: Table<any, string>;
  iitmDeadlines!: Table<any, string>;
  skillCourses!: Table<any, string>;
  skillSessions!: Table<any, string>;
  leadEvents!: Table<any, string>;
  leadTasks!: Table<any, string>;
  leadMembers!: Table<any, string>;
  ctfs!: Table<any, string>;
  spaceNotes!: Table<any, string>;
  outbox!: Table<OutboxRow, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("tanmay-os-offline");
    this.version(1).stores({
      tasks: "_id",
      schedule: "_id, dayOfWeek",
      checkins: "_id, date",
      jobs: "_id",
      dsa: "_id",
      aptitude: "_id",
      iitmCourses: "_id",
      iitmDeadlines: "_id, courseId",
      skillCourses: "_id",
      skillSessions: "_id, courseId",
      leadEvents: "_id, club",
      leadTasks: "_id, club",
      leadMembers: "_id, club",
      ctfs: "_id",
      spaceNotes: "_id, [coreSlug+itemSlug]",
      outbox: "id, createdAt",
      meta: "key",
    });
  }
}

export const offlineDb = typeof window !== "undefined" ? new OfflineDB() : (null as unknown as OfflineDB);

export async function replaceDomain(table: Table<any, string>, rows: any[]) {
  await table.clear();
  if (rows?.length) await table.bulkPut(rows);
}

export async function applySnapshot(snapshot: SyncSnapshot) {
  if (!offlineDb) return;
  const d = snapshot.domains;
  await Promise.all([
    replaceDomain(offlineDb.tasks, d.tasks),
    replaceDomain(offlineDb.schedule, d.schedule),
    replaceDomain(offlineDb.checkins, d.checkins),
    replaceDomain(offlineDb.jobs, d.jobs),
    replaceDomain(offlineDb.dsa, d.dsa),
    replaceDomain(offlineDb.aptitude, d.aptitude),
    replaceDomain(offlineDb.iitmCourses, d.iitmCourses),
    replaceDomain(offlineDb.iitmDeadlines, d.iitmDeadlines),
    replaceDomain(offlineDb.skillCourses, d.skillCourses),
    replaceDomain(offlineDb.skillSessions, d.skillSessions),
    replaceDomain(offlineDb.leadEvents, d.leadEvents),
    replaceDomain(offlineDb.leadTasks, d.leadTasks),
    replaceDomain(offlineDb.leadMembers, d.leadMembers),
    replaceDomain(offlineDb.ctfs, d.ctfs),
    replaceDomain(offlineDb.spaceNotes, d.spaces.notes),
  ]);
  await offlineDb.meta.put({ key: "pulledAt", value: snapshot.pulledAt });
  await offlineDb.meta.put({ key: "userId", value: snapshot.userId });
  await offlineDb.meta.put({ key: "spacesCores", value: d.spaces.cores });
}
