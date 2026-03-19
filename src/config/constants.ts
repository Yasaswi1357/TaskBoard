import type { StaffRole, TaskCategory, TaskStatus, TimeFilter } from "../types";

// ─── API ──────────────────────────────────────────────────────────────────────
export const API_BASE = "/api";

export const QUERY_STALE_TIME = 30_000; // 30 s — tasks change infrequently
export const QUERY_RETRY_COUNT = 2;

// ─── Display Labels ───────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<StaffRole, string> = {
  nurse: "Nurse",
  dietician: "Dietician",
  social_worker: "Social Worker",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  overdue: "Overdue",
  in_progress: "In Progress",
  completed: "Completed",
  upcoming: "Upcoming",
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  lab_work: "Lab Work",
  access_check: "Access Check",
  diet_counselling: "Diet Counselling",
  vaccination: "Vaccination",
  social_work: "Social Work",
  medication_review: "Medication Review",
  vitals: "Vitals",
  general: "General",
};

export const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  all: "All",
  overdue: "Overdue",
  due_today: "Due Today",
  upcoming: "Upcoming",
};

// ─── Status column order for Taskboard ────────────────────────────────────────
export const STATUS_COLUMNS: TaskStatus[] = [
  "overdue",
  "in_progress",
  "upcoming",
  "completed",
];

// ─── Role colours (Tailwind class names) ─────────────────────────────────────
export const ROLE_COLOR: Record<StaffRole, string> = {
  nurse: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  dietician: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  social_worker: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

export const STATUS_COLOR: Record<TaskStatus, string> = {
  overdue: "text-red-400 bg-red-400/10 border-red-400/20",
  in_progress: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  completed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  upcoming: "text-gray-400 bg-gray-400/10 border-gray-400/20",
};

export const STATUS_DOT: Record<TaskStatus, string> = {
  overdue: "bg-red-400",
  in_progress: "bg-blue-400",
  completed: "bg-emerald-400",
  upcoming: "bg-gray-500",
};

// ─── Transition options when editing a task status ───────────────────────────
export const NEXT_STATUS_OPTIONS: Record<TaskStatus, TaskStatus[]> = {
  upcoming: ["in_progress"],
  in_progress: ["completed", "upcoming"],
  overdue: ["in_progress", "completed"],
  completed: ["upcoming"],
};

export const ALL_ROLES: Array<StaffRole | "all"> = [
  "all",
  "nurse",
  "dietician",
  "social_worker",
];

export const ALL_TIME_FILTERS: TimeFilter[] = [
  "all",
  "overdue",
  "due_today",
  "upcoming",
];
