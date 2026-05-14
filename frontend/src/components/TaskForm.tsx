import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Task, TaskInput, TaskPriority, TaskStatus } from "../types";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "../types";

interface TaskFormProps {
  mode: "create" | "edit";
  initialTask?: Task | null;
  isSaving: boolean;
  error?: string | null;
  onSubmit: (values: TaskInput) => void | Promise<void>;
  onCancel: () => void;
}

const priorityOptions: TaskPriority[] = ["low", "medium", "high", "urgent"];

function toDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const timezoneOffset = parsedDate.getTimezoneOffset() * 60_000;
  return new Date(parsedDate.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toApiDate(value: string) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
}

export function TaskForm({
  mode,
  initialTask,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title || "");
  const [description, setDescription] = useState(initialTask?.description || "");
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || "todo");
  const [priority, setPriority] = useState<TaskPriority>(
    initialTask?.priority || "medium",
  );
  const [dueDate, setDueDate] = useState(toDateTimeLocal(initialTask?.due_date));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initialTask?.title || "");
    setDescription(initialTask?.description || "");
    setStatus(initialTask?.status || "todo");
    setPriority(initialTask?.priority || "medium");
    setDueDate(toDateTimeLocal(initialTask?.due_date));
    setLocalError(null);
  }, [initialTask]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setLocalError("Task title is required.");
      return;
    }

    setLocalError(null);
    await onSubmit({
      title: normalizedTitle,
      description: description.trim(),
      status,
      priority,
      due_date: toApiDate(dueDate),
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <div className="surface-card w-full max-w-2xl animate-float-in p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">
              {mode === "create" ? "New task" : "Edit task"}
            </p>
            <h2 className="mt-2 text-3xl">
              {mode === "create" ? "Capture the next step" : "Tune task details"}
            </h2>
          </div>
          <button
            className="secondary-button px-4 py-2"
            onClick={onCancel}
            type="button"
          >
            Close
          </button>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Title</span>
            <input
              className="soft-input"
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Write launch checklist"
              value={title}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </span>
            <textarea
              className="soft-input min-h-28 resize-none"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a little context, acceptance criteria, or links."
              value={description}
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
              <select
                className="soft-input"
                onChange={(event) => setStatus(event.target.value as TaskStatus)}
                value={status}
              >
                {TASK_STATUS_ORDER.map((item) => (
                  <option key={item} value={item}>
                    {TASK_STATUS_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Priority
              </span>
              <select
                className="soft-input"
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
                value={priority}
              >
                {priorityOptions.map((item) => (
                  <option key={item} value={item}>
                    {TASK_PRIORITY_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Due date</span>
            <input
              className="soft-input"
              onChange={(event) => setDueDate(event.target.value)}
              type="datetime-local"
              value={dueDate}
            />
          </label>

          {localError || error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {localError || error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="secondary-button"
              disabled={isSaving}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create task"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
