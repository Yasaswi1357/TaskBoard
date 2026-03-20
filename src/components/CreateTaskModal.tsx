import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Spinner } from "./ui/Feedback";
import type { CreateTaskPayload, StaffRole, TaskCategory } from "../types";
import { ROLE_LABELS, CATEGORY_LABELS } from "../config/constants";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSubmit: (payload: CreateTaskPayload) => void;
  isLoading: boolean;
}

const ROLES: StaffRole[] = ["nurse", "dietician", "social_worker"];
const CATEGORIES: TaskCategory[] = [
  "lab_work", "access_check", "diet_counselling", "vaccination",
  "social_work", "medication_review", "vitals", "general",
];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString().slice(0, 16);
};

interface FormErrors {
  title?: string;
  assigneeName?: string;
  dueDate?: string;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSubmit,
  isLoading,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedRole, setAssignedRole] = useState<StaffRole>("nurse");
  const [assigneeName, setAssigneeName] = useState("");   // ← person in charge
  const [category, setCategory] = useState<TaskCategory>("general");
  const [dueDate, setDueDate] = useState(tomorrow());
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const next: FormErrors = {};
    if (!title.trim()) next.title = "Title is required.";
    if (!assigneeName.trim()) next.assigneeName = "Person in charge is required.";
    if (!dueDate) next.dueDate = "Due date is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      patientId,
      title: title.trim(),
      description: description.trim() || undefined,
      assignedRole,
      assigneeName: assigneeName.trim(),
      category,
      dueDate: new Date(dueDate).toISOString(),
      notes: notes.trim() || undefined,
    });
  }

  function handleClose() {
    if (isLoading) return;
    setTitle("");
    setDescription("");
    setAssignedRole("nurse");
    setAssigneeName("");
    setCategory("general");
    setDueDate(tomorrow());
    setNotes("");
    setErrors({});
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`New Task — ${patientName}`}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>

        {/* Title */}
        <div>
          <label className="label" htmlFor="task-title">
            Task title <span className="text-red-400">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
            }}
            placeholder="e.g. Monthly CBC & BMP"
            className="input"
            autoFocus
          />
          {errors.title && (
            <p className="text-red-400 text-xs mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="label" htmlFor="task-desc">Description</label>
          <textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details…"
            rows={2}
            className="input resize-none"
          />
        </div>

        {/* Role + Person in charge */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="task-role">Assigned role</label>
            <select
              id="task-role"
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value as StaffRole)}
              className="select"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="task-assignee">
              Person in charge <span className="text-red-400">*</span>
            </label>
            <input
              id="task-assignee"
              type="text"
              value={assigneeName}
              onChange={(e) => {
                setAssigneeName(e.target.value);
                if (errors.assigneeName)
                  setErrors((p) => ({ ...p, assigneeName: undefined }));
              }}
              placeholder="e.g. Grace Nair"
              className="input"
            />
            {errors.assigneeName && (
              <p className="text-red-400 text-xs mt-1">{errors.assigneeName}</p>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="label" htmlFor="task-category">Category</label>
          <select
            id="task-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            className="select"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        {/* Due date */}
        <div>
          <label className="label" htmlFor="task-due">
            Due date <span className="text-red-400">*</span>
          </label>
          <input
            id="task-due"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              if (errors.dueDate) setErrors((p) => ({ ...p, dueDate: undefined }));
            }}
            className="input"
          />
          {errors.dueDate && (
            <p className="text-red-400 text-xs mt-1">{errors.dueDate}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="label" htmlFor="task-notes">Notes</label>
          <textarea
            id="task-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Clinical notes, context, warnings…"
            rows={2}
            className="input resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} className="btn-ghost" disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? <><Spinner size="sm" /> Creating…</> : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
