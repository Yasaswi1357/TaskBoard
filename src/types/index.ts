// ─── Domain Enums ────────────────────────────────────────────────────────────

export type TaskStatus = "overdue" | "in_progress" | "completed" | "upcoming";
export type StaffRole = "nurse" | "dietician" | "social_worker";
export type TaskCategory =
  | "lab_work"
  | "access_check"
  | "diet_counselling"
  | "vaccination"
  | "social_work"
  | "medication_review"
  | "vitals"
  | "general";
export type TimeFilter = "all" | "overdue" | "due_today" | "upcoming";

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  name: string;
  dob: string;
  mrn: string;
  unit: string;
  primaryNurse: string;
  nextSession: string | null;
  createdAt: string;
}

export interface SafePatient {
  id: string;
  name: string;
  dob: string;
  mrn: string;
  unit: string;
  primaryNurse: string;
  nextSession: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignedRole: StaffRole;
  assigneeId?: string;
  assigneeName?: string;
  dueDate: string;
  category: TaskCategory;
  notes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface SafeTask {
  id: string;
  patientId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedRole: StaffRole;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: string;
  category: TaskCategory;
  notes: string;
  completedAt: string | null;
  createdAt: string;
}

// ─── API Request / Response Shapes ───────────────────────────────────────────

export interface CreateTaskPayload {
  patientId: string;
  title: string;
  description?: string;
  assignedRole: StaffRole;
  assigneeId?: string;
  assigneeName?: string;      // ← person in charge name
  dueDate: string;
  category: TaskCategory;
  notes?: string;
}

export interface UpdateTaskPayload {
  status?: TaskStatus;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  notes?: string;
  completedAt?: string;
}

export interface PatientsResponse {
  patients: unknown[];
  total: number;
}

export interface TasksResponse {
  tasks: unknown[];
  patientId: string;
}

// ─── Stats & Summary ──────────────────────────────────────────────────────────

export interface StatsResponse {
  totalPatients: number;
  totalTasks: number;
  overdueCount: number;
  inProgressCount: number;
  completedToday: number;
}

export interface PatientSummary {
  patientId: string;
  matchingTaskCount: number;
}

export interface SummaryResponse {
  summaries: PatientSummary[];
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface FilterState {
  role: StaffRole | "all";
  time: TimeFilter;
  onlyAnomalies: boolean;
}

// ─── Guards / Validators ─────────────────────────────────────────────────────

const VALID_STATUSES: TaskStatus[] = ["overdue", "in_progress", "completed", "upcoming"];
const VALID_ROLES: StaffRole[] = ["nurse", "dietician", "social_worker"];
const VALID_CATEGORIES: TaskCategory[] = [
  "lab_work", "access_check", "diet_counselling", "vaccination",
  "social_work", "medication_review", "vitals", "general",
];

function isTaskStatus(val: unknown): val is TaskStatus {
  return typeof val === "string" && VALID_STATUSES.includes(val as TaskStatus);
}
function isStaffRole(val: unknown): val is StaffRole {
  return typeof val === "string" && VALID_ROLES.includes(val as StaffRole);
}
function isTaskCategory(val: unknown): val is TaskCategory {
  return typeof val === "string" && VALID_CATEGORIES.includes(val as TaskCategory);
}

export function toSafeTask(raw: unknown): SafeTask {
  const r = raw as Record<string, unknown>;
  return {
    id: typeof r.id === "string" ? r.id : "unknown-id",
    patientId: typeof r.patientId === "string" ? r.patientId : "",
    title: typeof r.title === "string" && r.title.trim() ? r.title.trim() : "Untitled Task",
    description: typeof r.description === "string" ? r.description : "",
    status: isTaskStatus(r.status) ? r.status : "upcoming",
    assignedRole: isStaffRole(r.assignedRole) ? r.assignedRole : "nurse",
    assigneeId: typeof r.assigneeId === "string" ? r.assigneeId : null,
    assigneeName: typeof r.assigneeName === "string" ? r.assigneeName : null,
    dueDate: typeof r.dueDate === "string" ? r.dueDate : new Date().toISOString(),
    category: isTaskCategory(r.category) ? r.category : "general",
    notes: typeof r.notes === "string" ? r.notes : "",
    completedAt: typeof r.completedAt === "string" ? r.completedAt : null,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
  };
}

export function toSafePatient(raw: unknown): SafePatient {
  const r = raw as Record<string, unknown>;
  return {
    id: typeof r.id === "string" ? r.id : "unknown-id",
    name: typeof r.name === "string" && r.name.trim() ? r.name.trim() : "Unknown Patient",
    dob: typeof r.dob === "string" ? r.dob : "",
    mrn: typeof r.mrn === "string" ? r.mrn : "N/A",
    unit: typeof r.unit === "string" ? r.unit : "General",
    primaryNurse: typeof r.primaryNurse === "string" ? r.primaryNurse : "Unassigned",
    nextSession: typeof r.nextSession === "string" ? r.nextSession : null,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
  };
}
