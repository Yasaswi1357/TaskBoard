import { useMemo, useState } from "react";
import type { SafeTask, StaffRole, TimeFilter, FilterState } from "../types";
import { isOverdue, isDueToday, isUpcoming } from "../utils/dateUtils";

export function useTaskFilters(tasks: SafeTask[]) {
  const [filters, setFilters] = useState<FilterState>({
    role: "all",
    time: "all",
    onlyAnomalies: false,
  });

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      // ── Role filter ──
      if (filters.role !== "all" && task.assignedRole !== filters.role) {
        return false;
      }

      // ── Time filter ──
      if (filters.time === "overdue" && !isOverdue(task.dueDate)) return false;
      if (filters.time === "due_today" && !isDueToday(task.dueDate)) return false;
      if (filters.time === "upcoming" && !isUpcoming(task.dueDate)) return false;

      return true;
    });
  }, [tasks, filters]);

  const setRole = (role: StaffRole | "all") =>
    setFilters((f) => ({ ...f, role }));

  const setTime = (time: TimeFilter) => setFilters((f) => ({ ...f, time }));

  const reset = () =>
    setFilters({ role: "all", time: "all", onlyAnomalies: false });

  const activeCount =
    (filters.role !== "all" ? 1 : 0) + (filters.time !== "all" ? 1 : 0);

  return { filtered, filters, setRole, setTime, reset, activeCount };
}

// ─── Pure filter function — exported for tests ────────────────────────────────
export function filterTasks(tasks: SafeTask[], filters: FilterState): SafeTask[] {
  return tasks.filter((task) => {
    if (filters.role !== "all" && task.assignedRole !== filters.role) return false;
    if (filters.time === "overdue" && !isOverdue(task.dueDate)) return false;
    if (filters.time === "due_today" && !isDueToday(task.dueDate)) return false;
    if (filters.time === "upcoming" && !isUpcoming(task.dueDate)) return false;
    return true;
  });
}
