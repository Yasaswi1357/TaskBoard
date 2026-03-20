import { clsx } from "clsx";
import { SlidersHorizontal, X } from "lucide-react";
import type { StaffRole, TimeFilter } from "../types";
import {
  ALL_ROLES,
  ALL_TIME_FILTERS,
  ROLE_LABELS,
  TIME_FILTER_LABELS,
} from "../config/constants";

interface FilterBarProps {
  role: StaffRole | "all";
  time: TimeFilter;
  activeCount: number;
  onRoleChange: (role: StaffRole | "all") => void;
  onTimeChange: (time: TimeFilter) => void;
  onReset: () => void;
}

export function FilterBar({
  role,
  time,
  activeCount,
  onRoleChange,
  onTimeChange,
  onReset,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-ink-muted">
        <SlidersHorizontal size={14} />
        <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
      </div>

      {/* Role filter */}
      <div className="flex items-center gap-1 bg-surface-muted rounded-lg p-1 border border-surface-border">
        {ALL_ROLES.map((r) => (
          <button
            key={r}
            onClick={() => onRoleChange(r)}
            className={clsx(
              "px-3 py-1 rounded-md text-xs font-medium transition-all duration-150",
              role === r
                ? "bg-accent text-white shadow-sm"
                : "text-ink-secondary hover:text-ink-primary"
            )}
          >
            {r === "all" ? "All Roles" : ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Time filter */}
      <div className="flex items-center gap-1 bg-surface-muted rounded-lg p-1 border border-surface-border">
        {ALL_TIME_FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => onTimeChange(t)}
            className={clsx(
              "px-3 py-1 rounded-md text-xs font-medium transition-all duration-150",
              time === t
                ? t === "overdue"
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-accent text-white shadow-sm"
                : "text-ink-secondary hover:text-ink-primary"
            )}
          >
            {TIME_FILTER_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Reset */}
      {activeCount > 0 && (
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-ink-secondary hover:text-ink-primary transition-colors"
        >
          <X size={12} />
          Clear ({activeCount})
        </button>
      )}
    </div>
  );
}
