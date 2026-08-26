import { NextResponse } from "next/server";
import { requireSyncUser } from "@/lib/sync/snapshot";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  toggleTaskStatusAction,
} from "@/app/actions/task.actions";
import { saveWorkLogsAction } from "@/app/actions/checkin.actions";
import {
  createScheduleBlockAction,
  updateScheduleBlockAction,
  deleteScheduleBlockAction,
} from "@/app/actions/schedule.actions";
import {
  upsertJobAction,
  updateJobStatusAction,
  deleteJobAction,
  upsertDsaAction,
  deleteDsaAction,
  upsertAptitudeAction,
  deleteAptitudeAction,
} from "@/app/actions/career.actions";
import {
  upsertIitmCourseAction,
  deleteIitmCourseAction,
  upsertIitmDeadlineAction,
  updateIitmDeadlineStatusAction,
  deleteIitmDeadlineAction,
  upsertSkillCourseAction,
  logSkillHoursAction,
  deleteSkillCourseAction,
} from "@/app/actions/education.actions";
import {
  upsertLeadEventAction,
  deleteLeadEventAction,
  upsertLeadTaskAction,
  updateLeadTaskStatusAction,
  deleteLeadTaskAction,
  upsertLeadMemberAction,
  deleteLeadMemberAction,
  upsertCtfAction,
  deleteCtfAction,
} from "@/app/actions/leadership.actions";
import {
  renameCoreAction,
  renameItemAction,
  setItemHiddenAction,
  addCoreAction,
  addItemAction,
  deleteCoreAction,
  deleteItemAction,
  saveSpaceNoteAction,
} from "@/app/actions/space.actions";

export type OutboxItem = {
  id: string;
  action: string;
  payload: any;
  createdAt: string;
};

async function applyItem(item: OutboxItem) {
  const { action, payload } = item;
  switch (action) {
    case "createTask":
      return createTaskAction(payload);
    case "updateTask":
      return updateTaskAction(payload.taskId, payload.data);
    case "deleteTask":
      return deleteTaskAction(payload.taskId);
    case "toggleTaskStatus":
      return toggleTaskStatusAction(payload.taskId, payload.status);

    case "saveWorkLogs":
      return saveWorkLogsAction(payload.dateStr, payload.workLogs);

    case "createScheduleBlock":
      return createScheduleBlockAction(payload);
    case "updateScheduleBlock":
      return updateScheduleBlockAction(payload.blockId, payload.data);
    case "deleteScheduleBlock":
      return deleteScheduleBlockAction(payload.blockId);

    case "upsertJob":
      return upsertJobAction(payload);
    case "updateJobStatus":
      return updateJobStatusAction(payload.id, payload.status);
    case "deleteJob":
      return deleteJobAction(payload.id);
    case "upsertDsa":
      return upsertDsaAction(payload);
    case "deleteDsa":
      return deleteDsaAction(payload.id);
    case "upsertAptitude":
      return upsertAptitudeAction(payload);
    case "deleteAptitude":
      return deleteAptitudeAction(payload.id);

    case "upsertIitmCourse":
      return upsertIitmCourseAction(payload);
    case "deleteIitmCourse":
      return deleteIitmCourseAction(payload.id);
    case "upsertIitmDeadline":
      return upsertIitmDeadlineAction(payload);
    case "updateIitmDeadlineStatus":
      return updateIitmDeadlineStatusAction(payload.id, payload.status);
    case "deleteIitmDeadline":
      return deleteIitmDeadlineAction(payload.id);
    case "upsertSkillCourse":
      return upsertSkillCourseAction(payload);
    case "logSkillHours":
      return logSkillHoursAction(payload.courseId, payload.minutes, payload.sessionDate, payload.notes);
    case "deleteSkillCourse":
      return deleteSkillCourseAction(payload.id);

    case "upsertLeadEvent":
      return upsertLeadEventAction(payload);
    case "deleteLeadEvent":
      return deleteLeadEventAction(payload.club, payload.id);
    case "upsertLeadTask":
      return upsertLeadTaskAction(payload);
    case "updateLeadTaskStatus":
      return updateLeadTaskStatusAction(payload.club, payload.id, payload.status);
    case "deleteLeadTask":
      return deleteLeadTaskAction(payload.club, payload.id);
    case "upsertLeadMember":
      return upsertLeadMemberAction(payload);
    case "deleteLeadMember":
      return deleteLeadMemberAction(payload.club, payload.id);
    case "upsertCtf":
      return upsertCtfAction(payload);
    case "deleteCtf":
      return deleteCtfAction(payload.id);

    case "renameCore":
      return renameCoreAction(payload.coreId, payload.name);
    case "renameItem":
      return renameItemAction(payload.coreId, payload.itemId, payload.name);
    case "setItemHidden":
      return setItemHiddenAction(payload.coreId, payload.itemId, payload.hidden);
    case "addCore":
      return addCoreAction(payload.name, payload.icon);
    case "addItem":
      return addItemAction(payload.coreId, payload.name, payload.icon);
    case "deleteCore":
      return deleteCoreAction(payload.coreId);
    case "deleteItem":
      return deleteItemAction(payload.coreId, payload.itemId);
    case "saveSpaceNote":
      return saveSpaceNoteAction(payload.coreSlug, payload.itemSlug, payload.notes);

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export async function POST(req: Request) {
  const userId = await requireSyncUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const items: OutboxItem[] = Array.isArray(body?.items) ? body.items : [];

  const applied: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const item of items) {
    try {
      await applyItem(item);
      applied.push(item.id);
    } catch (e: any) {
      failed.push({ id: item.id, error: e?.message || "Failed" });
      // Stop on first failure to preserve order semantics for dependent ops
      break;
    }
  }

  return NextResponse.json({ applied, failed });
}
