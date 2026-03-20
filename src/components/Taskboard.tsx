import { useState } from "react";
import { Users } from "lucide-react";
import { usePatients } from "../hooks/usePatients";
import { PatientRow } from "./PatientRow";
import { FilterBar } from "./FilterBar";
import { PatientRowSkeleton, EmptyState, ErrorState } from "./ui/Feedback";
import type { FilterState, StaffRole, TimeFilter } from "../types";

const DEFAULT_FILTERS: FilterState = {
  role: "all",
  time: "all",
  onlyAnomalies: false,
};

export function Taskboard() {
  const { data: patients, isLoading, isError, refetch } = usePatients();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const activeCount =
    (filters.role !== "all" ? 1 : 0) + (filters.time !== "all" ? 1 : 0);

  function setRole(role: StaffRole | "all") {
    setFilters((f) => ({ ...f, role }));
  }
  function setTime(time: TimeFilter) {
    setFilters((f) => ({ ...f, time }));
  }
  function reset() {
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Page title + stats */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">
            Today's Patient Board
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {isLoading
              ? "Loading patients…"
              : isError
              ? "Could not load patients."
              : `${patients?.length ?? 0} patients · track tasks across all care roles`}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar
        role={filters.role}
        time={filters.time}
        activeCount={activeCount}
        onRoleChange={setRole}
        onTimeChange={setTime}
        onReset={reset}
      />

      {/* Divider */}
      <div className="border-t border-surface-border" />

      {/* Patient list */}
      <div className="space-y-4">
        {isLoading && (
          Array.from({ length: 4 }).map((_, i) => <PatientRowSkeleton key={i} />)
        )}

        {isError && (
          <ErrorState
            message="Failed to load patients. Check your connection and try again."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && (!patients || patients.length === 0) && (
          <EmptyState
            title="No patients scheduled"
            description="Add patients to the system to see them here."
            icon={<Users size={40} />}
          />
        )}

        {!isLoading &&
          !isError &&
          patients?.map((patient) => (
            <PatientRow key={patient.id} patient={patient} filters={filters} />
          ))}
      </div>
    </main>
  );
}
