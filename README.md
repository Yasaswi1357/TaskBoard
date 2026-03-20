# Care Plan Taskboard

> Assignment 3 — Frontend / System Integration  
> Jano Healthcare SWE Internship Take-Home

A production-quality task management board for dialysis centre staff. Nurses, dieticians, and social workers can view per-patient care tasks, filter by role or urgency, create new tasks, and update status — with **optimistic UI and automatic rollback** on network failure.

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd care-plan-taskboard
npm install

# 2. Run (no backend needed — MSW intercepts all API calls)
npm run dev

# 3. Open
open http://localhost:5173

# 4. Run tests
npm test
```

> ✅ The app uses **Mock Service Worker (MSW)** to intercept API calls at the network level — no backend setup required. The mock layer includes 8 patients and 17 tasks with realistic data.

---

## Architecture Overview

```
src/
├── api/
│   └── client.ts          # Fetch wrapper — centralised error handling
├── components/
│   ├── ui/                # Dumb UI primitives (Badge, Modal, Feedback)
│   ├── Header.tsx
│   ├── FilterBar.tsx      # Role + time filters
│   ├── Taskboard.tsx      # Page-level composition
│   ├── PatientRow.tsx     # Per-patient expandable row + task grid
│   ├── TaskCard.tsx       # Individual task with status controls
│   └── CreateTaskModal.tsx
├── config/
│   └── constants.ts       # All labels, colours, thresholds — no magic numbers in components
├── hooks/
│   ├── usePatients.ts     # React Query fetch + SafePatient validation
│   ├── useTasks.ts        # Fetch, create, optimistic update/rollback
│   └── useTaskFilters.ts  # Pure filter logic (testable without React)
├── mocks/
│   ├── data.ts            # Seed data (8 patients, 17 tasks)
│   ├── handlers.ts        # MSW request handlers with simulated latency
│   ├── browser.ts         # MSW browser worker
│   └── server.ts          # MSW Node server (for tests)
├── types/
│   └── index.ts           # All domain types + toSafeTask / toSafePatient validators
└── utils/
    └── dateUtils.ts       # Date helpers (overdue, due today, upcoming)
```

### Data flow for a status update

```
User clicks "In Progress"
        │
        ▼
TaskCard.onStatusChange()
        │
        ▼
useUpdateTask.mutate({ taskId, payload })
        │
        ├── onMutate → cancel in-flight queries
        │            → snapshot previous cache
        │            → apply optimistic update to cache  ← UI updates immediately
        │
        ├── [API call] PATCH /api/tasks/:id
        │
        ├── onSuccess → toast "Task updated."
        │
        ├── onError   → restore snapshot             ← UI reverts silently
        │            → toast "Update failed — changes reverted."
        │
        └── onSettled → invalidate query → refetch from server
```

### State management: why React Query

React Query was chosen over Redux or Zustand because:

- **Optimistic updates with rollback** are a first-class pattern (`onMutate` / `onError` / `onSettled`)
- **Loading, error, and stale states** are handled without boilerplate
- **Cache invalidation** after mutations keeps data consistent across patient rows
- **Automatic retries** (configurable) handle transient network failures
- No action creators, reducers, or selectors needed for what is fundamentally a data-fetching problem

Redux would add indirection without benefit here. Zustand is suitable for local UI state (the filter state uses plain `useState` for this reason — it's not server state).

---

## Data Contracts

All API responses pass through a **validation layer** before being used in the UI. This means the app never crashes due to a missing or malformed field from the backend.

### Patient

```typescript
interface SafePatient {
  id: string
  name: string          // fallback: "Unknown Patient"
  dob: string
  mrn: string           // fallback: "N/A"
  unit: string          // fallback: "General"
  primaryNurse: string  // fallback: "Unassigned"
  nextSession: string | null
  createdAt: string
}
```

### Task

```typescript
type TaskStatus   = "overdue" | "in_progress" | "completed" | "upcoming"
type StaffRole    = "nurse" | "dietician" | "social_worker"
type TaskCategory = "lab_work" | "access_check" | "diet_counselling"
                  | "vaccination" | "social_work" | "medication_review"
                  | "vitals" | "general"

interface SafeTask {
  id: string
  patientId: string
  title: string              // fallback: "Untitled Task"
  description: string        // fallback: ""
  status: TaskStatus         // fallback: "upcoming" if unrecognised value
  assignedRole: StaffRole    // fallback: "nurse" if unrecognised value
  assigneeId: string | null
  assigneeName: string | null
  dueDate: string            // fallback: now
  category: TaskCategory     // fallback: "general"
  notes: string
  completedAt: string | null
  createdAt: string
}
```

**Why two types (Task vs SafeTask)?** `Task` is what we send to the API. `SafeTask` is what the UI uses after validation — every field has a guaranteed shape. This prevents the UI layer from ever needing to handle `undefined` for display-critical fields.

---

## Integration & Failure Modes

| Scenario | Behaviour |
|---|---|
| `GET /patients` fails | Full-page error state with retry button |
| `GET /patients/:id/tasks` fails | Per-patient error state with retry (other patients unaffected) |
| `PATCH /tasks/:id` fails | Optimistic update is rolled back; toast notifies user |
| `POST /patients/:id/tasks` fails | Toast error; modal stays open for retry |
| Missing optional fields in response | `toSafeTask` / `toSafePatient` apply defaults; no crash |
| Invalid `status` or `role` value from API | Validated enum check; falls back to safe default |
| Network offline | React Query retries twice with backoff; error state shown after |
| Slow network | Loading skeletons shown per-patient; not a global spinner |

### Adding a new role

1. Add the value to the `StaffRole` union in `types/index.ts`
2. Add a label to `ROLE_LABELS` in `config/constants.ts`
3. Add a colour to `ROLE_COLOR` in `config/constants.ts`
4. Add the role to `ALL_ROLES` in `config/constants.ts`

No component changes needed — all components derive their behaviour from these config objects.

### Adding a new task category

1. Add the value to the `TaskCategory` union in `types/index.ts`
2. Add a label to `CATEGORY_LABELS` in `config/constants.ts`

---

## Assumptions & Trade-offs

### Task status lifecycle

```
upcoming → in_progress → completed
overdue  → in_progress → completed
overdue  →              completed   (direct close)
completed → upcoming               (re-open)
```

I chose not to auto-derive `overdue` from the due date at render time for tasks that are `in_progress` or `completed`, to avoid a task flipping back to overdue if a nurse started it late. The `overdue` status is set either by the backend or during ingestion/seed.

### Filters are stateless and local

Filters live in `Taskboard` component state (not in React Query or a global store). This is intentional — filter state is ephemeral UI state, not server state. If multi-tab sync were required, this would move to a URL search param.

### No real-time updates

The assignment specifies "tolerates imperfect network" — not real-time. React Query's `staleTime: 30s` and `invalidateQueries` after mutations provide near-real-time consistency without WebSocket complexity.

### Mock error rate

MSW simulates a 10% PATCH failure rate and 5% POST failure rate to demonstrate rollback behaviour in development. This is configurable in `src/mocks/handlers.ts`.

### No auth

Out of scope for this assignment. The primaryNurse field on Patient and assigneeId on Task are placeholders for a future auth system.

---

## Known Limitations & What's Next

- **No pagination** — the patient list fetches all patients. For a real dialysis centre (50–200 patients), cursor-based pagination would be needed.
- **No drag-and-drop** — status is changed via buttons. A kanban drag-and-drop (dnd-kit) would be a natural next step.
- **No date range filter** — only overdue/today/upcoming buckets. A calendar date-picker filter would improve scheduling workflows.
- **No real backend** — MSW is production-quality for demos but would be replaced by a real Express/FastAPI service.
- **No WebSocket** — adding Socket.io or Supabase Realtime would enable live multi-nurse updates.
- **Error boundaries** — React Error Boundaries around each PatientRow would prevent one crashed row from affecting others.

---

## AI Tools Used

**Used for:** Initial scaffold boilerplate (package.json, tsconfig, tailwind config), early component structure suggestions, and drafting the MSW handler pattern.

**Reviewed and changed manually:**
- The entire `types/index.ts` file — the AI initially generated a flat interface without the `Safe*` validation pattern. I introduced the `toSafeTask` / `toSafePatient` coercion layer because unknown API shapes should be handled at the boundary, not scattered across components.
- The optimistic update logic in `useTasks.ts` — the AI's first version didn't cancel in-flight queries before applying the optimistic update, which would have caused race conditions. Fixed by adding `cancelQueries` in `onMutate`.
- The `filterTasks` pure function — split out from the hook specifically so it could be unit-tested without a React render environment.

**Where I disagreed with AI output:**
The AI suggested putting filter state inside React Query as a query key parameter (so each filter combination would have its own cache entry). I disagreed — filter state is UI state, not server state. The full patient+task list is fetched once and filtered client-side. This reduces API calls and keeps the filter UX instant.

---

## Tests

```bash
npm test
```

| Test file | What it covers |
|---|---|
| `tests/hooks/useTaskFilters.test.ts` | Pure filter logic — role, time, combined, edge cases |
| `tests/components/TaskCard.test.tsx` | Rendering, status transitions, spinner state, optimistic contract, `toSafeTask` validation |
