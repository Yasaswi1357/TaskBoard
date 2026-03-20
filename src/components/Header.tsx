import { Activity } from "lucide-react";

export function Header() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="border-b border-surface-border bg-surface-raised/60 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
            <Activity size={15} className="text-accent" />
          </div>
          <div>
            <span className="font-semibold text-ink-primary text-sm">Care Plan</span>
            <span className="text-ink-muted text-sm"> · Taskboard</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-muted hidden sm:block">{dateStr}</span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>
      </div>
    </header>
  );
}
