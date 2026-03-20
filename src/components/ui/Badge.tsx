import { clsx } from "clsx";
import type { TaskStatus, StaffRole } from "../../types";
import {
  ROLE_COLOR,
  ROLE_LABELS,
  STATUS_COLOR,
  STATUS_DOT,
  STATUS_LABELS,
} from "../../config/constants";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={clsx("badge", STATUS_COLOR[status], className)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}

interface RoleBadgeProps {
  role: StaffRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span className={clsx("badge", ROLE_COLOR[role], className)}>
      {ROLE_LABELS[role]}
    </span>
  );
}
