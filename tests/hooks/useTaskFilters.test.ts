import { describe, it, expect } from "vitest";
import { filterTasks } from "../../src/hooks/useTaskFilters";
import type { SafeTask, FilterState } from "../../src/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_TASK: SafeTask = {
  id: "t1",
  patientId: "p1",
  title: "Test task",
  description: "",
  status: "upcoming",
  assignedRole: "nurse",
  assigneeId: null,
  assigneeName: null,
  dueDate: new Date(Date.now() + 86_400_000 * 3).toISOString(), // 3 days ahead
  category: "general",
  notes: "",
  completedAt: null,
  createdAt: new Date().toISOString(),
};

const overdueDieticianTask: SafeTask = {
  ...BASE_TASK,
  id: "t2",
  status: "overdue",
  assignedRole: "dietician",
  dueDate: new Date(Date.now() - 86_400_000 * 2).toISOString(), // 2 days ago
};

const dueTodayNurseTask: SafeTask = {
  ...BASE_TASK,
  id: "t3",
  status: "in_progress",
  assignedRole: "nurse",
  dueDate: new Date().toISOString(), // now (today)
};

const completedSocialTask: SafeTask = {
  ...BASE_TASK,
  id: "t4",
  status: "completed",
  assignedRole: "social_worker",
  dueDate: new Date(Date.now() - 86_400_000).toISOString(),
  completedAt: new Date().toISOString(),
};

const upcomingNurseTask: SafeTask = {
  ...BASE_TASK,
  id: "t5",
  status: "upcoming",
  assignedRole: "nurse",
  dueDate: new Date(Date.now() + 86_400_000 * 5).toISOString(),
};

const ALL_TASKS = [
  BASE_TASK,
  overdueDieticianTask,
  dueTodayNurseTask,
  completedSocialTask,
  upcomingNurseTask,
];

const NO_FILTERS: FilterState = { role: "all", time: "all", onlyAnomalies: false };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("filterTasks", () => {
  it("returns all tasks when no filters are active", () => {
    const result = filterTasks(ALL_TASKS, NO_FILTERS);
    expect(result).toHaveLength(ALL_TASKS.length);
  });

  describe("role filter", () => {
    it("returns only nurse tasks when role = nurse", () => {
      const result = filterTasks(ALL_TASKS, { ...NO_FILTERS, role: "nurse" });
      expect(result.every((t) => t.assignedRole === "nurse")).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns only dietician tasks when role = dietician", () => {
      const result = filterTasks(ALL_TASKS, { ...NO_FILTERS, role: "dietician" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("t2");
    });

    it("returns only social_worker tasks when role = social_worker", () => {
      const result = filterTasks(ALL_TASKS, { ...NO_FILTERS, role: "social_worker" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("t4");
    });

    it("returns empty array when no tasks match the role", () => {
      const nurseTasks = ALL_TASKS.filter((t) => t.assignedRole === "nurse");
      const result = filterTasks(nurseTasks, { ...NO_FILTERS, role: "social_worker" });
      expect(result).toHaveLength(0);
    });
  });

  describe("time filter", () => {
    it("returns only overdue tasks when time = overdue", () => {
      const result = filterTasks(ALL_TASKS, { ...NO_FILTERS, time: "overdue" });
      // Overdue means: status is overdue (past due date)
      result.forEach((t) => {
        expect(new Date(t.dueDate).getTime()).toBeLessThan(Date.now());
      });
    });

    it("returns only due-today tasks when time = due_today", () => {
      const result = filterTasks(ALL_TASKS, { ...NO_FILTERS, time: "due_today" });
      result.forEach((t) => {
        const dueDay = new Date(t.dueDate).toDateString();
        expect(dueDay).toBe(new Date().toDateString());
      });
    });

    it("returns only future tasks when time = upcoming", () => {
      const result = filterTasks(ALL_TASKS, { ...NO_FILTERS, time: "upcoming" });
      result.forEach((t) => {
        expect(new Date(t.dueDate).getTime()).toBeGreaterThan(Date.now());
      });
    });
  });

  describe("combined filters", () => {
    it("applies role AND time filter together", () => {
      const result = filterTasks(ALL_TASKS, {
        ...NO_FILTERS,
        role: "nurse",
        time: "upcoming",
      });
      expect(result.every((t) => t.assignedRole === "nurse")).toBe(true);
      expect(result.every((t) => new Date(t.dueDate).getTime() > Date.now())).toBe(true);
    });

    it("returns empty array when combined filters match nothing", () => {
      const result = filterTasks(ALL_TASKS, {
        ...NO_FILTERS,
        role: "dietician",
        time: "due_today",
      });
      expect(result).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("handles empty task array gracefully", () => {
      const result = filterTasks([], NO_FILTERS);
      expect(result).toHaveLength(0);
    });

    it("handles single task matching filter", () => {
      const result = filterTasks([overdueDieticianTask], {
        ...NO_FILTERS,
        role: "dietician",
        time: "overdue",
      });
      expect(result).toHaveLength(1);
    });

    it("does not mutate the original task array", () => {
      const original = [...ALL_TASKS];
      filterTasks(ALL_TASKS, { ...NO_FILTERS, role: "nurse" });
      expect(ALL_TASKS).toEqual(original);
    });
  });
});
