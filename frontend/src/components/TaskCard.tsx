import type { CSSProperties } from "react";
import type { Task, TaskStatus } from "../types";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "../types";

interface TaskCardProps {
  task: Task;
  projectColor: string;
  isBusy: boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const priorityStyles: Record<Task["priority"], string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-100",
  medium: "bg-sky-50 text-sky-700 border-sky-100",
  high: "bg-amber-50 text-amber-700 border-amber-100",
  urgent: "bg-rose-50 text-rose-700 border-rose-100",
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return `rgba(15, 118, 110, ${alpha})`;
  }

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function formatDueDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "No due date";
  }

  return parsedDate.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskCard({
  task,
  projectColor,
  isBusy,
  onStatusChange,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const tint = projectColor || "#0f766e";
  const cardStyle: CSSProperties = {
    borderColor: hexToRgba(tint, 0.18),
    boxShadow: `0 16px 34px ${hexToRgba(tint, 0.1)}`,
  };

  return (
    <article
      className="rounded-[26px] border bg-white/95 p-5 transition hover:-translate-y-1"
      style={cardStyle}
    >
      <div
        className="mb-4 h-1.5 rounded-full"
        style={{ backgroundColor: tint }}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-slate-900">{task.title}</h4>
          <p className="mt-2 text-sm text-slate-500">{formatDueDate(task.due_date)}</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            priorityStyles[task.priority]
          }`}
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      {task.description ? (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {task.description}
        </p>
      ) : (
        <p className="mt-4 text-sm italic text-slate-400">
          No description yet. A little context can keep momentum high.
        </p>
      )}

      <div className="mt-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Status
        </label>
        <select
          className="soft-input py-2.5 text-sm"
          disabled={isBusy}
          onChange={(event) =>
            onStatusChange(task.id, event.target.value as TaskStatus)
          }
          value={task.status}
        >
          {TASK_STATUS_ORDER.map((item) => (
            <option key={item} value={item}>
              {TASK_STATUS_LABELS[item]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          className="secondary-button flex-1 py-2.5"
          disabled={isBusy}
          onClick={() => onEdit(task)}
          type="button"
        >
          Edit
        </button>
        <button
          className="rounded-2xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          onClick={() => onDelete(task)}
          type="button"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
