export type ClientTask = {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tier: string;
  category: string;
  project: string;
  dueDate: string | null;
  startDate: string | null;
  endDate: string | null;
  notifyDate: string | null;
  startTime: string;
  endTime: string;
  estimatedMinutes: number | null;
  energy: string;
  tags: string[];
  notes: string;
  isMustDo: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export function toClientTask(task: any): ClientTask {
  return {
    _id: String(task._id),
    title: String(task.title ?? ""),
    description: String(task.description ?? ""),
    status: String(task.status ?? "Inbox"),
    priority: String(task.priority ?? "P2 Medium"),
    tier: String(task.tier ?? "Tier 3"),
    category: String(task.category ?? ""),
    project: String(task.project ?? ""),
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    startDate: task.startDate ? new Date(task.startDate).toISOString() : null,
    endDate: task.endDate ? new Date(task.endDate).toISOString() : null,
    notifyDate: task.notifyDate ? new Date(task.notifyDate).toISOString() : null,
    startTime: String(task.startTime ?? ""),
    endTime: String(task.endTime ?? ""),
    estimatedMinutes: typeof task.estimatedMinutes === "number" ? task.estimatedMinutes : null,
    energy: String(task.energy ?? "Medium"),
    tags: Array.isArray(task.tags) ? task.tags.map(String) : [],
    notes: String(task.notes ?? ""),
    isMustDo: Boolean(task.isMustDo),
    createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : null,
    updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : null,
  };
}
