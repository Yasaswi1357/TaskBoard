import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SafeTask } from "../../src/types";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderWithQuery(ui: React.ReactElement, client?: QueryClient) {
  const qc = client ?? makeQueryClient();
  return {
    ...render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>),
    queryClient: qc,
  };
}

const UPCOMING_TASK: SafeTask = {
  id: "t-test-1",
  patientId: "p1",
  title: "Monthly CBC & BMP",
  description: "Routine labs",
  status: "upcoming",
  assignedRole: "nurse",
  assigneeId: "s1",
  assigneeName: "Grace Nair",
  dueDate: new Date(Date.now() + 86_400_000).toISOString(),
  category: "lab_work",
  notes: "Fasting required.",
  completedAt: null,
  createdAt: new Date().toISOString(),
};

const OVERDUE_TASK: SafeTask = {
  ...UPCOMING_TASK,
  id: "t-test-2",
  status: "overdue",
  dueDate: new Date(Date.now() - 86_400_000 * 3).toISOString(),
};

const getTaskCard = () =>
  import("../../src/components/TaskCard").then((m) => m.TaskCard);

describe("TaskCard", () => {
  it("renders the task title", async () => {
    const TaskCard = await getTaskCard();
    renderWithQuery(
      <TaskCard task={UPCOMING_TASK} onStatusChange={vi.fn()} isUpdating={false} />
    );
    expect(screen.getByText("Monthly CBC & BMP")).toBeInTheDocument();
  });

  it("shows the status badge", async () => {
    const TaskCard = await getTaskCard();
    renderWithQuery(
      <TaskCard task={UPCOMING_TASK} onStatusChange={vi.fn()} isUpdating={false} />
    );
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
  });

  it("shows the role badge", async () => {
    const TaskCard = await getTaskCard();
    renderWithQuery(
      <TaskCard task={UPCOMING_TASK} onStatusChange={vi.fn()} isUpdating={false} />
    );
    expect(screen.getByText("Nurse")).toBeInTheDocument();
  });

  it("applies overdue visual treatment", async () => {
    const TaskCard = await getTaskCard();
    const { container } = renderWithQuery(
      <TaskCard task={OVERDUE_TASK} onStatusChange={vi.fn()} isUpdating={false} />
    );
    expect((container.firstChild as HTMLElement).className).toMatch(/red/);
  });

  it("shows notes when 'Show notes' is clicked", async () => {
    const TaskCard = await getTaskCard();
    renderWithQuery(
      <TaskCard task={UPCOMING_TASK} onStatusChange={vi.fn()} isUpdating={false} />
    );
    expect(screen.queryByText("Fasting required.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Show notes"));
    expect(await screen.findByText("Fasting required.")).toBeInTheDocument();
  });

  it("calls onStatusChange when a transition button is clicked", async () => {
    const TaskCard = await getTaskCard();
    const onStatusChange = vi.fn();
    renderWithQuery(
      <TaskCard task={UPCOMING_TASK} onStatusChange={onStatusChange} isUpdating={false} />
    );
    fireEvent.click(screen.getByText("In Progress"));
    expect(onStatusChange).toHaveBeenCalledWith("t-test-1", "in_progress");
  });

  it("shows spinner while updating", async () => {
    const TaskCard = await getTaskCard();
    renderWithQuery(
      <TaskCard task={UPCOMING_TASK} onStatusChange={vi.fn()} isUpdating={true} />
    );
    expect(screen.getByText("Saving…")).toBeInTheDocument();
  });

  it("hides transition buttons for completed tasks", async () => {
    const TaskCard = await getTaskCard();
    const completed: SafeTask = {
      ...UPCOMING_TASK,
      status: "completed",
      completedAt: new Date().toISOString(),
    };
    renderWithQuery(
      <TaskCard task={completed} onStatusChange={vi.fn()} isUpdating={false} />
    );
    expect(screen.queryByText("In Progress")).not.toBeInTheDocument();
  });

  it("strikes through title for completed tasks", async () => {
    const TaskCard = await getTaskCard();
    const completed: SafeTask = {
      ...UPCOMING_TASK,
      status: "completed",
      completedAt: new Date().toISOString(),
    };
    const { container } = renderWithQuery(
      <TaskCard task={completed} onStatusChange={vi.fn()} isUpdating={false} />
    );
    const el = container.querySelector(".line-through");
    expect(el).toBeInTheDocument();
    expect(el?.textContent).toBe("Monthly CBC & BMP");
  });
});

describe("Optimistic update contract", () => {
  it("fires onStatusChange synchronously (optimistic)", async () => {
    const TaskCard = await getTaskCard();
    const onStatusChange = vi.fn();
    renderWithQuery(
      <TaskCard task={UPCOMING_TASK} onStatusChange={onStatusChange} isUpdating={false} />
    );
    fireEvent.click(screen.getByText("In Progress"));
    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith("t-test-1", "in_progress");
  });

  it("shows correct next-status options for overdue", async () => {
    const TaskCard = await getTaskCard();
    renderWithQuery(
      <TaskCard task={OVERDUE_TASK} onStatusChange={vi.fn()} isUpdating={false} />
    );
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("suppresses transition buttons while isUpdating=true", async () => {
    const TaskCard = await getTaskCard();
    const onStatusChange = vi.fn();
    renderWithQuery(
      <TaskCard task={UPCOMING_TASK} onStatusChange={onStatusChange} isUpdating={true} />
    );
    expect(screen.queryByText("In Progress")).not.toBeInTheDocument();
    expect(onStatusChange).not.toHaveBeenCalled();
  });
});

describe("toSafeTask — API shape validation", () => {
  it("falls back on empty object", async () => {
    const { toSafeTask } = await import("../../src/types");
    const safe = toSafeTask({});
    expect(safe.title).toBe("Untitled Task");
    expect(safe.status).toBe("upcoming");
    expect(safe.assignedRole).toBe("nurse");
    expect(safe.category).toBe("general");
    expect(safe.completedAt).toBeNull();
  });

  it("preserves valid fields", async () => {
    const { toSafeTask } = await import("../../src/types");
    const safe = toSafeTask({
      id: "t1",
      title: "Real Task",
      status: "in_progress",
      assignedRole: "dietician",
      category: "lab_work",
    });
    expect(safe.title).toBe("Real Task");
    expect(safe.status).toBe("in_progress");
    expect(safe.assignedRole).toBe("dietician");
  });

  it("rejects unknown status and role", async () => {
    const { toSafeTask } = await import("../../src/types");
    const safe = toSafeTask({ status: "banana", assignedRole: "wizard" });
    expect(safe.status).toBe("upcoming");
    expect(safe.assignedRole).toBe("nurse");
  });

  it("trims whitespace from title", async () => {
    const { toSafeTask } = await import("../../src/types");
    const safe = toSafeTask({ title: "  Check vitals  " });
    expect(safe.title).toBe("Check vitals");
  });
});
