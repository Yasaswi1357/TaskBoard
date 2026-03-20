import { isToday, isPast, isFuture, parseISO, format, formatDistanceToNow } from "date-fns";
import type { TaskStatus } from "../types";

/**
 * Derive the correct TaskStatus from a dueDate string and current stored status.
 * If the task is already completed, we never override it.
 */
export function deriveStatus(dueDate: string, storedStatus: TaskStatus): TaskStatus {
  if (storedStatus === "completed") return "completed";
  if (storedStatus === "in_progress") return "in_progress";

  const due = parseISO(dueDate);
  if (isPast(due) && !isToday(due)) return "overdue";
  if (isToday(due)) return storedStatus === "overdue" ? "overdue" : "in_progress";
  return "upcoming";
}

export function isOverdue(dueDate: string): boolean {
  return isPast(parseISO(dueDate)) && !isToday(parseISO(dueDate));
}

export function isDueToday(dueDate: string): boolean {
  return isToday(parseISO(dueDate));
}

export function isUpcoming(dueDate: string): boolean {
  return isFuture(parseISO(dueDate)) && !isToday(parseISO(dueDate));
}

export function formatDueDate(dueDate: string): string {
  const d = parseISO(dueDate);
  if (isToday(d)) return `Today ${format(d, "h:mm a")}`;
  if (isPast(d)) return `${formatDistanceToNow(d)} ago`;
  return format(d, "MMM d, h:mm a");
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy");
}
