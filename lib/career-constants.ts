export const JOB_STATUSES = ["Wishlist", "Applied", "OA", "Interview", "Offer", "Rejected", "Ghosted"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const DSA_TOPICS = [
  "Arrays",
  "Strings",
  "Linked List",
  "Stack / Queue",
  "Trees",
  "Graphs",
  "DP",
  "Recursion",
  "Greedy",
  "Binary Search",
  "Math",
  "Other",
] as const;

export const DSA_PLATFORMS = ["LeetCode", "Codeforces", "GFG", "HackerRank", "InterviewBit", "AtCoder", "Other"] as const;

export const APTITUDE_CATEGORIES = ["Quantitative", "Logical", "Verbal"] as const;
