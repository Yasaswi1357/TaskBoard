/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#0f1117",
          raised: "#171b26",
          border: "#252a38",
          muted: "#1e2333",
        },
        ink: {
          primary: "#e8eaf0",
          secondary: "#8b92a5",
          muted: "#4f5669",
        },
        role: {
          nurse: "#3b82f6",
          dietician: "#10b981",
          social_worker: "#f59e0b",
        },
        status: {
          overdue: "#ef4444",
          in_progress: "#3b82f6",
          completed: "#10b981",
          upcoming: "#6b7280",
        },
        accent: "#6366f1",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
