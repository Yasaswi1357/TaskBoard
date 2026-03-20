import { API_BASE } from "../config/constants";
import type {
  CreateTaskPayload,
  UpdateTaskPayload,
  PatientsResponse,
  TasksResponse,
} from "../types";

// ─── Generic fetch wrapper ────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let details: unknown;
    try {
      details = await res.json();
    } catch {
      details = await res.text();
    }
    throw new ApiError(res.status, `Request failed: ${res.statusText}`, details);
  }

  return res.json() as Promise<T>;
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export const patientsApi = {
  list: (): Promise<PatientsResponse> => request("/patients"),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const tasksApi = {
  list: (patientId: string): Promise<TasksResponse> =>
    request(`/patients/${patientId}/tasks`),

  create: (patientId: string, payload: CreateTaskPayload) =>
    request(`/patients/${patientId}/tasks`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (taskId: string, payload: UpdateTaskPayload) =>
    request(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export { ApiError };
