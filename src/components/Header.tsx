import { Activity, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function Header() {
  const { theme, toggleTheme } = useTheme();

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="border-b border-surface-border bg-surface-raised/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
            <Activity size={15} className="text-accent" />
          </div>
          <div>
            <span className="font-semibold text-ink-primary text-sm">Care Plan</span>
            <span className="text-ink-muted text-sm"> · Taskboard</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-muted hidden sm:block">{dateStr}</span>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="btn-ghost p-2 rounded-lg"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun size={15} className="text-ink-secondary" />
            ) : (
              <Moon size={15} className="text-ink-secondary" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
