import { AlertTriangle, CheckCircle, Clock, Users, ListTodo } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "../api/client";
import type { StatsResponse } from "../types";

function StatCard({
  icon,
  label,
  value,
  color,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface-raised border border-surface-border rounded-xl">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>{icon}</div>
      <div>
        {isLoading ? (
          <div className="skeleton h-5 w-8 rounded mb-1" />
        ) : (
          <p className="text-lg font-bold text-ink-primary leading-none">{value}</p>
        )}
        <p className="text-xs text-ink-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function StatsBar() {
  const { data, isLoading } = useQuery<StatsResponse>({
    queryKey: ["stats"],
    queryFn: () => statsApi.get(),
    staleTime: 15_000,
    refetchInterval: 60_000,
  });

  const stats = data ?? {
    totalPatients: 0,
    totalTasks: 0,
    overdueCount: 0,
    inProgressCount: 0,
    completedToday: 0,
  };

  return (
    <div className="flex flex-wrap gap-3">
      <StatCard
        icon={<Users size={15} className="text-accent" />}
        label="Patients"
        value={stats.totalPatients}
        color="bg-accent/10"
        isLoading={isLoading}
      />
      <StatCard
        icon={<ListTodo size={15} className="text-ink-secondary" />}
        label="Total Tasks"
        value={stats.totalTasks}
        color="bg-surface-muted"
        isLoading={isLoading}
      />
      <StatCard
        icon={<AlertTriangle size={15} className="text-red-400" />}
        label="Overdue"
        value={stats.overdueCount}
        color="bg-red-400/10"
        isLoading={isLoading}
      />
      <StatCard
        icon={<Clock size={15} className="text-blue-400" />}
        label="In Progress"
        value={stats.inProgressCount}
        color="bg-blue-400/10"
        isLoading={isLoading}
      />
      <StatCard
        icon={<CheckCircle size={15} className="text-emerald-400" />}
        label="Completed Today"
        value={stats.completedToday}
        color="bg-emerald-400/10"
        isLoading={isLoading}
      />
    </div>
  );
}
