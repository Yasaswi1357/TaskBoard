# Care Plan Taskboard

> Assignment 3 — Frontend / System Integration  
> Jano Healthcare SWE Internship Take-Home

A production-quality task management board for dialysis centre staff. Nurses, dieticians, and social workers can view per-patient care tasks, filter by role or urgency, search across patients and tasks, create new tasks with an assigned person, and update task status — with **optimistic UI and automatic rollback** on network failure.

## Live Demo

🔗 **https://task-board-vert-chi.vercel.app/**

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/Yasaswi1357/TaskBoard.git
cd TaskBoard

# 2. Generate MSW service worker (once)
npx msw init public/ --save

# 3. Run
npm run dev

# 4. Open
http://localhost:5173

# 5. Run tests
npm test
```

> ✅ No backend needed. **Mock Service Worker (MSW)** intercepts all API calls at the network level, simulating a real server with latency, errors, and mutable state. 8 patients and 17 tasks are seeded on startup.

---

## Features

### Core

- **Patient board** — expandable rows per patient, tasks grouped into 4 status columns (Overdue / In Progress / Upcoming / Completed)
- **Status transitions** — click to move tasks between statuses with optimistic UI
- **Create task** — modal form with title, description, role, **person in charge**, category, due date, and notes
- **Edit notes** — inline notes toggle per task card

### Filtering & Search

- **Role filter** — Nurse / Dietician / Social Worker / All
- **Time filter** — Overdue / Due Today / Upcoming / All
- **Patient & task search** — debounced search across patient name, MRN, and task title
- **Smart patient sorting** — patients with more matching tasks float to the top; patients with zero matches are dimmed and pushed to the bottom

### Dashboard

- **Stats bar** — live counts for total patients, total tasks, overdue, in-progress, and completed today
- **Overdue indicators** — red ring and alert badge on patients with overdue tasks

### UX

- **Dark / Light mode** — toggle in the header, preference saved to localStorage
- **Loading skeletons** — per-patient, not a global spinner
- **Error states** — per-patient retry, does not break the whole board
- **Optimistic rollback** — status changes revert automatically if the server returns an error
- **Toast notifications** — success and error feedback on all mutations

---

## Architecture Overview

```
src/
├── context/
│   └── ThemeContext.tsx        # Dark/light mode — CSS variables + localStorage
├── api/
│   └── client.ts              # Fetch wrapper — centralised error handling
│                                 patientsApi · tasksApi · statsApi · summaryApi
├── components/
│   ├── ui/                    # Dumb primitives — Badge, Modal, Spinner,
│   │                            Skeleton, EmptyState, ErrorState
│   ├── Header.tsx             # Sticky header with theme toggle
│   ├── StatsBar.tsx           # Live summary counts
│   ├── FilterBar.tsx          # Role + time filter segments
│   ├── Taskboard.tsx          # Page composition — search, sort, filter state
│   ├── PatientRow.tsx         # Expandable patient row + 4-column task grid
│   ├── TaskCard.tsx           # Task card with status controls
│   └── CreateTaskModal.tsx    # New task form with person-in-charge field
├── config/
│   └── constants.ts           # All labels, colours, status flows — no magic
│                                 numbers scattered in components
├── hooks/
│   ├── usePatients.ts         # React Query fetch + SafePatient validation
│   ├── useTasks.ts            # Fetch · create · optimistic update/rollback
│   └── useTaskFilters.ts      # Pure filter logic — exported for unit tests
├── mocks/
│   ├── data.ts                # Seed data — 8 patients, 17 tasks
│   ├── handlers.ts            # MSW handlers — GET/POST/PATCH + stats/summary
│   ├── browser.ts             # MSW browser worker
│   └── server.ts              # MSW node server for Vitest
├── types/
│   └── index.ts               # Domain types · SafeTask/SafePatient validators
│                                 toSafeTask · toSafePatient coercion
└── utils/
    └── dateUtils.ts           # isOverdue · isDueToday · isUpcoming · formatDueDate
```

### Request lifecycle — status update

```
User clicks "In Progress"
        │
        ▼
TaskCard.onStatusChange()
        │
        ▼
useUpdateTask.mutate({ taskId, payload })
        │
        ├── onMutate  → cancel in-flight queries
        │             → snapshot previous cache
        │             → apply update to cache   ← UI updates immediately
        │
        ├── PATCH /api/tasks/:id
        │
        ├── onSuccess → toast "Task updated."
        │             → invalidate stats + summary
        │
        ├── onError   → restore snapshot        ← UI reverts
        │             → toast "Update failed — changes reverted."
        │
        └── onSettled → refetch from server
```

### Patient sorting logic

When filters or search are active, the `/api/summary` endpoint returns per-patient matching task counts. Patients are sorted client-side:

```
matchingCount > 0  →  sorted descending by count  (top)
matchingCount = 0  →  pushed to bottom, dimmed     (end)
```

This means a nurse filtering to "Overdue" immediately sees the most critical patients first.

### State management — why React Query

React Query was chosen over Redux or Zustand because:

- **Optimistic updates with rollback** are a first-class pattern (`onMutate` / `onError` / `onSettled`)
- **Loading, error, stale states** handled without boilerplate
- **Cache invalidation** after mutations keeps stats, summaries, and task lists consistent
- **Automatic retries** handle transient network failures
- No reducers, actions, or selectors needed for what is fundamentally a data-fetching problem

Filter state uses plain `useState` — it is ephemeral UI state, not server state, so React Query is not the right tool for it.

---

## Data Contracts

All API responses pass through a **validation layer** before reaching the UI. The app never crashes due to a missing or malformed field from the backend.

### Patient

```typescript
interface SafePatient {
  id: string;
  name: string; // fallback: "Unknown Patient"
  dob: string;
  mrn: string; // fallback: "N/A"
  unit: string; // fallback: "General"
  primaryNurse: string; // fallback: "Unassigned"
  nextSession: string | null;
  createdAt: string;
}
```

### Task

```typescript
type TaskStatus = "overdue" | "in_progress" | "completed" | "upcoming";
type StaffRole = "nurse" | "dietician" | "social_worker";
type TaskCategory =
  | "lab_work"
  | "access_check"
  | "diet_counselling"
  | "vaccination"
  | "social_work"
  | "medication_review"
  | "vitals"
  | "general";

interface SafeTask {
  id: string;
  patientId: string;
  title: string; // fallback: "Untitled Task"
  description: string; // fallback: ""
  status: TaskStatus; // fallback: "upcoming" if unrecognised
  assignedRole: StaffRole; // fallback: "nurse" if unrecognised
  assigneeId: string | null;
  assigneeName: string | null; // person in charge
  dueDate: string;
  category: TaskCategory; // fallback: "general"
  notes: string;
  completedAt: string | null;
  createdAt: string;
}
```

**Why SafeTask vs Task?** `Task` is what we send to the API. `SafeTask` is what the UI uses after validation — every field has a guaranteed shape so the UI never needs to handle `undefined` for display-critical fields.

---

## Integration & Failure Modes

| Scenario                                    | Behaviour                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `GET /patients` fails                       | Full-page error state with retry button                                  |
| `GET /patients/:id/tasks` fails             | Per-patient error state with retry; other patients unaffected            |
| `PATCH /tasks/:id` fails (10% rate in mock) | Optimistic update rolled back; toast "Update failed — changes reverted." |
| `POST /patients/:id/tasks` fails (5% rate)  | Toast error; modal stays open for retry                                  |
| Missing optional fields in response         | `toSafeTask` / `toSafePatient` apply safe defaults; no crash             |
| Invalid `status` or `role` value from API   | Validated enum check; falls back to safe default                         |
| Network offline                             | React Query retries twice with backoff; per-patient error shown          |
| Slow network                                | Skeletons shown per-patient; board remains interactive                   |

### Extending the system

**Adding a new role:**

1. Add to `StaffRole` union in `types/index.ts`
2. Add label to `ROLE_LABELS` in `config/constants.ts`
3. Add colour to `ROLE_COLOR` in `config/constants.ts`
4. Add to `ALL_ROLES` in `config/constants.ts`

No component changes needed — all components derive behaviour from config.

**Adding a new task category:**

1. Add to `TaskCategory` union in `types/index.ts`
2. Add label to `CATEGORY_LABELS` in `config/constants.ts`

---

## Assumptions & Trade-offs

### Task status lifecycle

```
upcoming  → in_progress → completed
overdue   → in_progress → completed
overdue   →               completed   (direct close)
```

Tasks already `in_progress` are not auto-marked `overdue` at render time — a nurse who started a task late should not see it flip back to overdue. The `overdue` status is set by the backend or during data ingestion.

### Filters are local state, not URL state

Filter and search state live in component state. This is intentional — they are ephemeral UI state, not server state or shareable state. If sharable filter links were required, these would move to URL search params (`?role=nurse&time=overdue`).

### Search is debounced at 300ms

The search input waits 300ms after the last keystroke before triggering the summary API call. This prevents a request on every keypress while keeping the experience responsive.

### MSW runs in all environments

Because this app has no real backend, MSW is started unconditionally (not just in development). In a production app with a real API, MSW would be removed entirely and the `api/client.ts` layer would point to the real server with zero component changes required.

### Mock failure rates

- PATCH: 10% failure rate — demonstrates optimistic rollback
- POST: 5% failure rate — demonstrates create error handling

Both are configurable in `src/mocks/handlers.ts`.

---

## Tests

```bash
npm test
```

| File                                 | Coverage                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `tests/hooks/useTaskFilters.test.ts` | Pure filter logic — role, time, combined, edge cases (13 tests)                                |
| `tests/components/TaskCard.test.tsx` | Rendering, transitions, spinner state, optimistic contract, `toSafeTask` validation (16 tests) |

**Total: 29 tests, all passing.**

---

## Known Limitations & What's Next

- **No pagination** — fetches all patients at once. Cursor-based pagination needed for 50+ patients.
- **No drag-and-drop** — status changed via buttons. `dnd-kit` would be a natural upgrade.
- **No real-time sync** — multiple nurses see stale data until they refresh. Socket.io or Supabase Realtime would fix this.
- **No auth** — `assigneeId` and `primaryNurse` are placeholders for a future auth system.
- **No date range filter** — only bucketed filters (overdue/today/upcoming). A calendar date picker would improve scheduling.
- **No React Error Boundaries** — a crashed PatientRow would bubble up. Error boundaries per row would isolate failures.
- **Search is client-routed through MSW** — in a real system, search would hit a database full-text index.

---

## Tech Stack

| Layer         | Choice                         |
| ------------- | ------------------------------ |
| Framework     | React 18 + TypeScript          |
| Build         | Vite                           |
| Styling       | Tailwind CSS                   |
| State / Data  | TanStack React Query v5        |
| Mocking       | Mock Service Worker (MSW) v2   |
| Testing       | Vitest + React Testing Library |
| Notifications | react-hot-toast                |
| Deployment    | Vercel                         |

---

## AI Tools Used

**Used for:** Initial project scaffold, package.json dependencies, early component structure suggestions, and MSW handler patterns.

**Reviewed and changed manually:**

- The entire `types/index.ts` — introduced the `Safe*` validation pattern with `toSafeTask` / `toSafePatient` coercion. The AI's initial version had a flat interface with no boundary validation.
- The optimistic update logic in `useTasks.ts` — the AI's first version didn't cancel in-flight queries before applying the optimistic update, which would cause race conditions. Fixed by adding `cancelQueries` in `onMutate`.
- The `filterTasks` pure function — split out from the hook specifically to be unit-tested without a React render environment.
- The patient sorting logic — the AI suggested sorting purely client-side from cached task data, but that would break when filters changed. Moved to a dedicated `/api/summary` endpoint so the sort always reflects the active filter state.

**Where I disagreed with AI output:**
The AI suggested putting filter state inside React Query as a query key parameter so each filter combination would have its own cache entry. I disagreed — filter state is UI state, not server state. The full patient and task list is fetched once and filtered client-side. This reduces API calls and keeps filter interactions instant with no loading states.
