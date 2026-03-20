import { http, HttpResponse, delay } from "msw";
import type { Task } from "../types";
import type { CreateTaskPayload, UpdateTaskPayload } from "../types";
import { MOCK_PATIENTS, MOCK_TASKS } from "./data";

let patients = [...MOCK_PATIENTS];
let tasks = [...MOCK_TASKS];

const LATENCY = { min: 200, max: 500 };
const jitter = () =>
  Math.floor(Math.random() * (LATENCY.max - LATENCY.min) + LATENCY.min);

// ─── GET /api/patients ────────────────────────────────────────────────────────
const getPatients = http.get("/api/patients", async () => {
  await delay(jitter());
  return HttpResponse.json({ patients, total: patients.length });
});

// ─── GET /api/patients/:id/tasks ─────────────────────────────────────────────
const getPatientTasks = http.get("/api/patients/:id/tasks", async ({ params }) => {
  await delay(jitter());
  const patientTasks = tasks.filter((t) => t.patientId === params.id);
  return HttpResponse.json({ tasks: patientTasks, patientId: params.id });
});

// ─── POST /api/patients/:id/tasks ────────────────────────────────────────────
const createTask = http.post("/api/patients/:id/tasks", async ({ params, request }) => {
  await delay(jitter());

  if (Math.random() < 0.05) {
    return HttpResponse.json({ error: "Internal server error." }, { status: 500 });
  }

  const body = (await request.json()) as CreateTaskPayload;

  if (!body.title?.trim()) {
    return HttpResponse.json({ error: "title is required" }, { status: 422 });
  }
  if (!body.dueDate) {
    return HttpResponse.json({ error: "dueDate is required" }, { status: 422 });
  }

  const newTask: Task = {
    id: `t-${Date.now()}`,
    patientId: params.id as string,
    title: body.title.trim(),
    description: body.description ?? "",
    status: "upcoming",
    assignedRole: body.assignedRole ?? "nurse",
    assigneeId: body.assigneeId,
    assigneeName: body.assigneeName ?? undefined,   // ← store name
    dueDate: body.dueDate,
    category: body.category ?? "general",
    notes: body.notes ?? "",
    createdAt: new Date().toISOString(),
  };

  tasks = [...tasks, newTask];
  return HttpResponse.json(newTask, { status: 201 });
});

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────────
const updateTask = http.patch("/api/tasks/:id", async ({ params, request }) => {
  await delay(jitter());

  // 10% failure rate to demo optimistic rollback
  if (Math.random() < 0.1) {
    return HttpResponse.json({ error: "Server error. Changes not saved." }, { status: 500 });
  }

  const body = (await request.json()) as UpdateTaskPayload;
  const idx = tasks.findIndex((t) => t.id === params.id);

  if (idx === -1) {
    return HttpResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const updated: Task = {
    ...tasks[idx],
    ...body,
    completedAt:
      body.status === "completed"
        ? new Date().toISOString()
        : tasks[idx].completedAt,
  };

  tasks = tasks.map((t) => (t.id === params.id ? updated : t));
  return HttpResponse.json(updated);
});

// ─── GET /api/stats ───────────────────────────────────────────────────────────
const getStats = http.get("/api/stats", async () => {
  await delay(100);
  const today = new Date().toDateString();
  return HttpResponse.json({
    totalPatients: patients.length,
    totalTasks: tasks.length,
    overdueCount: tasks.filter((t) => t.status === "overdue").length,
    inProgressCount: tasks.filter((t) => t.status === "in_progress").length,
    completedToday: tasks.filter(
      (t) => t.completedAt && new Date(t.completedAt).toDateString() === today
    ).length,
  });
});

// ─── GET /api/summary ─────────────────────────────────────────────────────────
// Returns per-patient matching task counts given role/time/search filters.
// Used by Taskboard to sort patients by relevance.
const getSummary = http.get("/api/summary", async ({ request }) => {
  await delay(100);
  const url = new URL(request.url);
  const role = url.searchParams.get("role");
  const time = url.searchParams.get("time");
  const search = url.searchParams.get("search")?.toLowerCase() ?? "";
  const today = new Date().toDateString();

  const summaries = patients.map((p) => {
    let ptasks = tasks.filter((t) => t.patientId === p.id);

    // Role filter
    if (role && role !== "all") {
      ptasks = ptasks.filter((t) => t.assignedRole === role);
    }

    // Time filter
    if (time && time !== "all") {
      if (time === "overdue") ptasks = ptasks.filter((t) => t.status === "overdue");
      if (time === "due_today")
        ptasks = ptasks.filter((t) => new Date(t.dueDate).toDateString() === today);
      if (time === "upcoming") ptasks = ptasks.filter((t) => t.status === "upcoming");
    }

    // Search: if patient name matches, count all their (role/time filtered) tasks
    // If patient name doesn't match, only count tasks whose title matches
    if (search) {
      const nameMatch =
        p.name.toLowerCase().includes(search) ||
        p.mrn.toLowerCase().includes(search);
      if (!nameMatch) {
        ptasks = ptasks.filter((t) => t.title.toLowerCase().includes(search));
      }
    }

    return { patientId: p.id, matchingTaskCount: ptasks.length };
  });

  return HttpResponse.json({ summaries });
});

export const handlers = [
  getPatients,
  getPatientTasks,
  createTask,
  updateTask,
  getStats,
  getSummary,
];

export function resetMockData() {
  patients = [...MOCK_PATIENTS];
  tasks = [...MOCK_TASKS];
}
