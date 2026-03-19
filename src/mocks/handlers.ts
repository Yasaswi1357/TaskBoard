import { http, HttpResponse, delay } from "msw";
import type { Task } from "../types";
import type { CreateTaskPayload, UpdateTaskPayload } from "../types";
import { MOCK_PATIENTS, MOCK_TASKS } from "./data";

// In-memory mutable store so mutations persist within a session
let patients = [...MOCK_PATIENTS];
let tasks = [...MOCK_TASKS];

// Simulate realistic network latency
const LATENCY = { min: 200, max: 600 };
const jitter = () =>
  Math.floor(Math.random() * (LATENCY.max - LATENCY.min) + LATENCY.min);

// ─── GET /api/patients ────────────────────────────────────────────────────────
const getPatients = http.get("/api/patients", async () => {
  await delay(jitter());
  return HttpResponse.json({
    patients,
    total: patients.length,
  });
});

// ─── GET /api/patients/:id/tasks ─────────────────────────────────────────────
const getPatientTasks = http.get(
  "/api/patients/:id/tasks",
  async ({ params }) => {
    await delay(jitter());
    const patientTasks = tasks.filter((t) => t.patientId === params.id);
    return HttpResponse.json({
      tasks: patientTasks,
      patientId: params.id,
    });
  }
);

// ─── POST /api/patients/:id/tasks ────────────────────────────────────────────
const createTask = http.post(
  "/api/patients/:id/tasks",
  async ({ params, request }) => {
    await delay(jitter());

    // Simulate occasional server errors for realism
    if (Math.random() < 0.05) {
      return HttpResponse.json(
        { error: "Internal server error. Please retry." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as CreateTaskPayload;

    if (!body.title?.trim()) {
      return HttpResponse.json(
        { error: "title is required" },
        { status: 422 }
      );
    }
    if (!body.dueDate) {
      return HttpResponse.json(
        { error: "dueDate is required" },
        { status: 422 }
      );
    }

    const newTask: Task = {
      id: `t-${Date.now()}`,
      patientId: params.id as string,
      title: body.title.trim(),
      description: body.description ?? "",
      status: "upcoming",
      assignedRole: body.assignedRole ?? "nurse",
      assigneeId: body.assigneeId,
      dueDate: body.dueDate,
      category: body.category ?? "general",
      notes: body.notes ?? "",
      createdAt: new Date().toISOString(),
    };

    tasks = [...tasks, newTask];

    return HttpResponse.json(newTask, { status: 201 });
  }
);

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────────
const updateTask = http.patch("/api/tasks/:id", async ({ params, request }) => {
  await delay(jitter());

  // Simulate occasional server errors — used to test optimistic rollback
  if (Math.random() < 0.1) {
    return HttpResponse.json(
      { error: "Server error. Changes not saved." },
      { status: 500 }
    );
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

export const handlers = [getPatients, getPatientTasks, createTask, updateTask];

// Expose reset helper for tests
export function resetMockData() {
  patients = [...MOCK_PATIENTS];
  tasks = [...MOCK_TASKS];
}
