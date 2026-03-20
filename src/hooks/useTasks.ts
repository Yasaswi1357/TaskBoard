import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { tasksApi } from "../api/client";
import { toSafeTask, type SafeTask, type UpdateTaskPayload, type CreateTaskPayload } from "../types";
import { QUERY_STALE_TIME, QUERY_RETRY_COUNT } from "../config/constants";

// ─── Query key factory ────────────────────────────────────────────────────────
export const taskKeys = {
  all: ["tasks"] as const,
  patient: (patientId: string) => ["tasks", patientId] as const,
};

// ─── Fetch tasks for one patient ──────────────────────────────────────────────
export function usePatientTasks(patientId: string) {
  return useQuery<SafeTask[]>({
    queryKey: taskKeys.patient(patientId),
    queryFn: async () => {
      const res = await tasksApi.list(patientId);
      return (res.tasks ?? []).map(toSafeTask);
    },
    staleTime: QUERY_STALE_TIME,
    retry: QUERY_RETRY_COUNT,
  });
}

// ─── Create task ──────────────────────────────────────────────────────────────
export function useCreateTask(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) =>
      tasksApi.create(patientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.patient(patientId) });
      toast.success("Task created.");
    },
    onError: () => {
      toast.error("Failed to create task. Please try again.");
    },
  });
}

// ─── Update task status — with optimistic update & rollback ──────────────────
export function useUpdateTask(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: UpdateTaskPayload;
    }) => tasksApi.update(taskId, payload),

    /**
     * Optimistically apply the update before the server responds.
     * We snapshot the previous cache so we can roll back on failure.
     */
    onMutate: async ({ taskId, payload }) => {
      // Cancel any in-flight refetches for this patient's tasks
      await queryClient.cancelQueries({ queryKey: taskKeys.patient(patientId) });

      // Snapshot previous value
      const previous = queryClient.getQueryData<SafeTask[]>(
        taskKeys.patient(patientId)
      );

      // Apply optimistic update
      queryClient.setQueryData<SafeTask[]>(
        taskKeys.patient(patientId),
        (old) =>
          (old ?? []).map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...payload,
                  completedAt:
                    payload.status === "completed"
                      ? new Date().toISOString()
                      : task.completedAt,
                }
              : task
          )
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      // Roll back to previous cache state
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.patient(patientId), context.previous);
      }
      toast.error("Update failed — changes reverted.");
    },

    onSuccess: () => {
      toast.success("Task updated.");
    },

    onSettled: () => {
      // Always re-sync with server after mutation settles
      queryClient.invalidateQueries({ queryKey: taskKeys.patient(patientId) });
    },
  });
}
