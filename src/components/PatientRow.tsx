import { useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, Plus, AlertTriangle, User, SearchX } from "lucide-react";
import type { SafePatient, SafeTask, TaskStatus, FilterState } from "../types";
import { usePatientTasks, useUpdateTask, useCreateTask } from "../hooks/useTasks";
import { TaskCard } from "./TaskCard";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskCardSkeleton, ErrorState } from "./ui/Feedback";
import { STATUS_COLUMNS, STATUS_LABELS, STATUS_DOT } from "../config/constants";

interface PatientRowProps {
  patient: SafePatient;
  filters: FilterState;
  searchTerm: string;
  matchingTaskCount: number | null;  // null = not yet loaded
  filtersActive: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PatientRow({
  patient,
  filters,
  searchTerm,
  matchingTaskCount,
  filtersActive,
}: PatientRowProps) {
  const [expanded, setExpanded] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: allTasks, isLoading, isError, refetch } = usePatientTasks(patient.id);
  const updateMutation = useUpdateTask(patient.id);
  const createMutation = useCreateTask(patient.id);

  // Apply role + time filters
  const filtered = (allTasks ?? []).filter((task) => {
    if (filters.role !== "all" && task.assignedRole !== filters.role) return false;
    if (filters.time === "overdue" && task.status !== "overdue") return false;
    if (filters.time === "due_today") {
      const today = new Date().toDateString();
      if (new Date(task.dueDate).toDateString() !== today) return false;
    }
    if (filters.time === "upcoming" && task.status !== "upcoming") return false;
    return true;
  });

  // Apply search filter on task titles
  // If the patient name / MRN matches the search → show all (role/time filtered) tasks
  // Otherwise → only show tasks whose title matches search
  const patientNameMatch =
    searchTerm &&
    (patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()));

  const tasks: SafeTask[] = searchTerm && !patientNameMatch
    ? filtered.filter((t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filtered;

  const overdueCount = (allTasks ?? []).filter((t) => t.status === "overdue").length;
  const hasOverdue = overdueCount > 0;

  // Dim patients with 0 matching tasks when filters/search are active
  const isDimmed = filtersActive && matchingTaskCount === 0;

  const byStatus = STATUS_COLUMNS.reduce<Record<TaskStatus, SafeTask[]>>(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    { overdue: [], in_progress: [], upcoming: [], completed: [] }
  );

  function handleStatusChange(taskId: string, status: TaskStatus) {
    updateMutation.mutate({ taskId, payload: { status } });
  }

  return (
    <div
      data-testid={`patient-row-${patient.id}`}
      className={clsx(
        "card overflow-hidden transition-all duration-300",
        hasOverdue && !isDimmed && "ring-1 ring-red-500/20",
        isDimmed && "opacity-40"
      )}
    >
      {/* Patient header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-surface-muted/50 transition-colors text-left"
        aria-expanded={expanded}
      >
        {/* Avatar */}
        <div
          className={clsx(
            "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
            hasOverdue ? "bg-red-500/20 text-red-400" : "bg-accent/20 text-accent"
          )}
        >
          {getInitials(patient.name)}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-ink-primary text-sm truncate">
              {patient.name}
            </span>
            {hasOverdue && (
              <span className="flex items-center gap-1 text-xs text-red-400 shrink-0">
                <AlertTriangle size={11} />
                {overdueCount} overdue
              </span>
            )}
            {isDimmed && (
              <span className="flex items-center gap-1 text-xs text-ink-muted shrink-0">
                <SearchX size={11} />
                no matching tasks
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
            <span className="font-mono">{patient.mrn}</span>
            <span>·</span>
            <span>{patient.unit}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <User size={10} />
              {patient.primaryNurse}
            </span>
          </div>
        </div>

        {/* Task count pills */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {STATUS_COLUMNS.filter((s) => byStatus[s].length > 0).map((s) => (
            <span key={s} className="flex items-center gap-1 text-xs text-ink-muted">
              <span className={clsx("w-1.5 h-1.5 rounded-full", STATUS_DOT[s])} />
              {byStatus[s].length}
            </span>
          ))}

          <button
            onClick={(e) => { e.stopPropagation(); setCreateOpen(true); }}
            className="btn-ghost p-1.5 ml-1"
            aria-label={`Add task for ${patient.name}`}
            title="Add task"
          >
            <Plus size={14} />
          </button>

          <ChevronDown
            size={15}
            className={clsx(
              "text-ink-muted transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Task grid — collapsible */}
      {expanded && (
        <div className="border-t border-surface-border">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <TaskCardSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <ErrorState
              message="Could not load tasks for this patient."
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && tasks.length === 0 && (
            <div className="py-8 text-center text-ink-muted text-sm">
              {filtersActive
                ? "No tasks match the current filters or search."
                : "No tasks yet. Click + to add one."}
            </div>
          )}

          {!isLoading && !isError && tasks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-surface-border">
              {STATUS_COLUMNS.map((status) => (
                <div key={status} className="p-3 space-y-2 min-h-[80px]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={clsx("w-1.5 h-1.5 rounded-full", STATUS_DOT[status])} />
                    <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="ml-auto text-xs text-ink-muted font-mono">
                      {byStatus[status].length}
                    </span>
                  </div>

                  {byStatus[status].length === 0 ? (
                    <div className="text-xs text-ink-muted/40 py-2 text-center">
                      {status === "completed" ? "None yet ✓" : "—"}
                    </div>
                  ) : (
                    byStatus[status].map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        isUpdating={
                          updateMutation.isPending &&
                          updateMutation.variables?.taskId === task.id
                        }
                      />
                    ))
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create task modal */}
      <CreateTaskModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        patientId={patient.id}
        patientName={patient.name}
        onSubmit={(payload) => {
          createMutation.mutate(payload, {
            onSuccess: () => setCreateOpen(false),
          });
        }}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
