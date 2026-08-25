export const LEADERSHIP_CLUBS = ["Apthex", "CyberX"] as const;
export type LeadershipClub = (typeof LEADERSHIP_CLUBS)[number];

export const LEADERSHIP_EVENT_TYPES = ["Meeting", "Workshop", "Event", "CTF", "Talk", "Outreach", "Other"] as const;
export type LeadershipEventType = (typeof LEADERSHIP_EVENT_TYPES)[number];

export const LEADERSHIP_EVENT_STATUSES = ["Planned", "Done", "Cancelled"] as const;
export type LeadershipEventStatus = (typeof LEADERSHIP_EVENT_STATUSES)[number];

export const LEADERSHIP_TASK_STATUSES = ["Todo", "Doing", "Done", "Blocked"] as const;
export type LeadershipTaskStatus = (typeof LEADERSHIP_TASK_STATUSES)[number];

export const CTF_RESULTS = ["Solved", "Attempted", "Unsolved"] as const;
export type CtfResult = (typeof CTF_RESULTS)[number];
