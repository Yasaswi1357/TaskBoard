import { clsx } from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizes = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-8 h-8" };
  return (
    <svg
      className={clsx("animate-spin text-accent", sizes[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function PatientRowSkeleton() {
  return (
    <div className="card p-4 animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-3 mb-4">
        <div className="skeleton w-9 h-9 rounded-full" />
        <div className="space-y-1.5">
          <div className="skeleton h-3.5 w-36 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
        <div className="ml-auto skeleton h-5 w-20 rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="skeleton h-20 rounded-lg" aria-hidden="true" />
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {icon && (
        <div className="mb-4 text-ink-muted opacity-50">{icon}</div>
      )}
      <p className="text-ink-secondary font-medium">{title}</p>
      {description && (
        <p className="text-ink-muted text-sm mt-1 max-w-xs">{description}</p>
      )}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-10 h-10 rounded-full bg-red-400/10 flex items-center justify-center mb-4">
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-ink-secondary font-medium">Something went wrong</p>
      <p className="text-ink-muted text-sm mt-1 max-w-xs">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-4">
          Try again
        </button>
      )}
    </div>
  );
}
