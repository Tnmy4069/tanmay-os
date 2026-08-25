export const IITM_COURSE_STATUSES = ["Planned", "In Progress", "Completed", "Dropped"] as const;
export type IitmCourseStatus = (typeof IITM_COURSE_STATUSES)[number];

export const IITM_DEADLINE_TYPES = ["Assignment", "Quiz", "Exam", "Project", "Lab"] as const;
export type IitmDeadlineType = (typeof IITM_DEADLINE_TYPES)[number];

export const IITM_DEADLINE_STATUSES = ["Todo", "Submitted", "Graded", "Missed"] as const;
export type IitmDeadlineStatus = (typeof IITM_DEADLINE_STATUSES)[number];

export const SKILL_STATUSES = ["Planned", "In Progress", "Completed", "Paused"] as const;
export type SkillStatus = (typeof SKILL_STATUSES)[number];

export const SKILL_PLATFORMS = [
  "Coursera",
  "Udemy",
  "YouTube",
  "NPTEL",
  "Official docs",
  "Book",
  "Bootcamp",
  "Other",
] as const;
