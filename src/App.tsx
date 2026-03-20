import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Header } from "./components/Header";
import { Taskboard } from "./components/Taskboard";
import { QUERY_RETRY_COUNT, QUERY_STALE_TIME } from "./config/constants";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      retry: QUERY_RETRY_COUNT,
      refetchOnWindowFocus: false,
    },
  },
});

function ToasterWithTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: isDark ? "#171b26" : "#ffffff",
          color: isDark ? "#e8eaf0" : "#0f172a",
          border: `1px solid ${isDark ? "#252a38" : "#e2e8f0"}`,
          borderRadius: "10px",
          fontSize: "13px",
        },
        success: {
          iconTheme: { primary: "#10b981", secondary: isDark ? "#171b26" : "#ffffff" },
        },
        error: {
          iconTheme: { primary: "#ef4444", secondary: isDark ? "#171b26" : "#ffffff" },
        },
      }}
    />
  );
}

function AppShell() {
  return (
    <div className="min-h-screen">
      <Header />
      <Taskboard />
      <ToasterWithTheme />
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
