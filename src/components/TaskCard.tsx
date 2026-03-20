import { useState } from "react";
import { clsx } from "clsx";
import { Clock, ChevronDown, FileText } from "lucide-react";
import type { SafeTask, TaskStatus } from "../types";
import { StatusBadge, RoleBadge } from "./ui/Badge";
import { Spinner } from "./ui/Feedback";
import { CATEGORY_LABELS, NEXT_STATUS_OPTIONS, STATUS_LABELS } from "../config/constants";
import { formatDueDate } from "../utils/dateUtils";

interface TaskCardProps {
  task: SafeTask;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  isUpdating: boolean;
  "data-testid"?: string;
}

export function TaskCard({ task, onStatusChange, isUpdating, "data-testid": testId }: TaskCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const nextOptions = NEXT_STATUS_OPTIONS[task.status];
  const isOverdue = task.status === "overdue";

  return (
    <div
      data-testid={testId ?? `task-card-${task.id}`}
      className={clsx(
        "group relative bg-surface border rounded-xl p-3.5 transition-all duration-200 hover:border-surface-border/80",
        isOverdue
          ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
          : "border-surface-border hover:bg-surface-raised/50"
      )}
    >
      {/* Overdue indicator stripe */}
      {isOverdue && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full bg-red-500" />
      )}

      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <p
          className={clsx(
            "text-sm font-medium leading-snug",
            task.status === "completed"
              ? "line-through text-ink-muted"
              : "text-ink-primary"
          )}
        >
          {task.title}
        </p>
        <StatusBadge status={task.status} className="shrink-0 ml-1" />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted mb-3">
        <RoleBadge role={task.assignedRole} />
        <span className="text-surface-border">·</span>
        <span className="font-mono text-xs">{CATEGORY_LABELS[task.category]}</span>
        {task.assigneeName && (
          <>
            <span className="text-surface-border">·</span>
            <span>{task.assigneeName}</span>
          </>
        )}
      </div>

      {/* Due date */}
      <div
        className={clsx(
          "flex items-center gap-1 text-xs mb-3",
          isOverdue ? "text-red-400" : "text-ink-muted"
        )}
      >
        <Clock size={11} />
        <span>{formatDueDate(task.dueDate)}</span>
      </div>

      {/* Notes toggle */}
      {task.notes && (
        <button
          onClick={() => setShowNotes((v) => !v)}
          className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink-secondary transition-colors mb-2"
        >
          <FileText size={11} />
          {showNotes ? "Hide notes" : "Show notes"}
        </button>
      )}

      {showNotes && task.notes && (
        <p className="text-xs text-ink-secondary bg-surface-muted rounded-lg p-2.5 mb-3 leading-relaxed border border-surface-border animate-fade-in">
          {task.notes}
        </p>
      )}

      {/* Status transition buttons */}
      {nextOptions.length > 0 && task.status !== "completed" && (
        <div className="flex items-center gap-1.5 pt-2.5 border-t border-surface-border">
          {isUpdating ? (
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Spinner size="sm" />
              <span>Saving…</span>
            </div>
          ) : (
            nextOptions.map((next) => (
              <button
                key={next}
                onClick={() => onStatusChange(task.id, next)}
                className={clsx(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-150 hover:scale-105 active:scale-95",
                  next === "completed"
                    ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    : next === "in_progress"
                    ? "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    : "border-surface-border text-ink-secondary hover:bg-surface-raised"
                )}
              >
                <ChevronDown size={11} />
                {STATUS_LABELS[next]}
              </button>
            ))
          )}
        </div>
      )}

      {task.status === "completed" && task.completedAt && (
        <div className="flex items-center gap-1 pt-2.5 border-t border-surface-border text-xs text-emerald-500/70">
          <span>✓ Completed {formatDueDate(task.completedAt)}</span>
        </div>
      )}
    </div>
  );
}
