import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Header />
        <Taskboard />
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#171b26",
            color: "#e8eaf0",
            border: "1px solid #252a38",
            borderRadius: "10px",
            fontSize: "13px",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#171b26" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#171b26" },
          },
        }}
      />

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
