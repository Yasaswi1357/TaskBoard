import { useState, useMemo, useEffect } from "react";
import { Users, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usePatients } from "../hooks/usePatients";
import { summaryApi } from "../api/client";
import { PatientRow } from "./PatientRow";
import { FilterBar } from "./FilterBar";
import { StatsBar } from "./StatsBar";
import { PatientRowSkeleton, EmptyState, ErrorState } from "./ui/Feedback";
import type { FilterState, StaffRole, TimeFilter, SummaryResponse } from "../types";

const DEFAULT_FILTERS: FilterState = {
  role: "all",
  time: "all",
  onlyAnomalies: false,
};

export function Taskboard() {
  const { data: patients, isLoading, isError, refetch } = usePatients();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search by 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch per-patient match counts (used for sorting)
  const { data: summaryData } = useQuery<SummaryResponse>({
    queryKey: ["summary", filters.role, filters.time, debouncedSearch],
    queryFn: () => summaryApi.get(filters, debouncedSearch),
    staleTime: 10_000,
    enabled: !!patients,
  });

  const activeFilterCount =
    (filters.role !== "all" ? 1 : 0) + (filters.time !== "all" ? 1 : 0);

  function setRole(role: StaffRole | "all") {
    setFilters((f) => ({ ...f, role }));
  }
  function setTime(time: TimeFilter) {
    setFilters((f) => ({ ...f, time }));
  }
  function reset() {
    setFilters(DEFAULT_FILTERS);
    setSearchTerm("");
  }

  // Sort patients:
  // - Patients with more matching tasks → top
  // - Patients with 0 matching tasks → bottom
  const sortedPatients = useMemo(() => {
    if (!patients) return [];

    return [...patients].sort((a, b) => {
      const aCount =
        summaryData?.summaries.find((s) => s.patientId === a.id)?.matchingTaskCount ?? 0;
      const bCount =
        summaryData?.summaries.find((s) => s.patientId === b.id)?.matchingTaskCount ?? 0;

      // Zero-match patients go to the end
      if (aCount === 0 && bCount > 0) return 1;
      if (bCount === 0 && aCount > 0) return -1;
      // Otherwise sort by count descending
      return bCount - aCount;
    });
  }, [patients, summaryData]);

  const filtersOrSearchActive =
    activeFilterCount > 0 || debouncedSearch.trim().length > 0;

  return (
    <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Today's Patient Board</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          {isLoading
            ? "Loading patients…"
            : isError
            ? "Could not load patients."
            : `${patients?.length ?? 0} patients · track tasks across all care roles`}
        </p>
      </div>

      {/* Stats bar */}
      <StatsBar />

      <div className="border-t border-surface-border" />

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search patients by name, MRN or task title…"
          className="input pl-9 pr-9"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter bar */}
      <FilterBar
        role={filters.role}
        time={filters.time}
        activeCount={activeFilterCount}
        onRoleChange={setRole}
        onTimeChange={setTime}
        onReset={reset}
      />

      {/* Patient list */}
      <div className="space-y-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <PatientRowSkeleton key={i} />)}

        {isError && (
          <ErrorState
            message="Failed to load patients. Check your connection and try again."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && sortedPatients.length === 0 && (
          <EmptyState
            title="No patients found"
            description={
              filtersOrSearchActive
                ? "Try clearing the search or filters."
                : "Add patients to the system to see them here."
            }
            icon={<Users size={40} />}
          />
        )}

        {!isLoading &&
          !isError &&
          sortedPatients.map((patient) => {
            const matchCount =
              summaryData?.summaries.find((s) => s.patientId === patient.id)
                ?.matchingTaskCount ?? null;
            return (
              <PatientRow
                key={patient.id}
                patient={patient}
                filters={filters}
                searchTerm={debouncedSearch}
                matchingTaskCount={matchCount}
                filtersActive={filtersOrSearchActive}
              />
            );
          })}
      </div>
    </main>
  );
}
