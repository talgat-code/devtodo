import type { CSSProperties } from "react";
import type { Task, TaskStatus } from "../types";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "../types";
import { hexToRgba } from "../utils";

interface TaskCardProps {
  task: Task;
  projectColor: string;
  isBusy: boolean;
  index?: number;
  isDragging?: boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
}

const priorityStyles: Record<Task["priority"], string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-100",
  medium: "bg-sky-50 text-sky-700 border-sky-100",
  high: "bg-amber-50 text-amber-700 border-amber-100",
  urgent: "bg-rose-50 text-rose-700 border-rose-100",
};

const statusBeaconColor: Partial<Record<TaskStatus, string>> = {
  in_progress: "bg-sky-500",
  review: "bg-amber-500",
};

function formatDueDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    label: parsed.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    isOverdue: parsed < new Date(),
  };
}

export function TaskCard({
  task,
  projectColor,
  isBusy,
  index = 0,
  isDragging = false,
  onStatusChange,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const tint = projectColor || "#0f766e";
  const cardStyle: CSSProperties = {
    borderColor: hexToRgba(tint, 0.18),
    boxShadow: `0 12px 28px ${hexToRgba(tint, 0.08)}`,
    animationDelay: `${index * 65}ms`,
  };

  const dueDateInfo = formatDueDate(task.due_date);
  const beaconColor = statusBeaconColor[task.status];
  const isOverdueActive = dueDateInfo?.isOverdue && task.status !== "done";

  return (
    <article
      className={`group relative animate-fade-up rounded-[24px] border bg-white/97 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        isDragging ? "opacity-40 scale-95 shadow-none" : "cursor-grab active:cursor-grabbing"
      }`}
      draggable={!isBusy}
      onDragEnd={onDragEnd}
      onDragStart={(e) => onDragStart(e, task.id)}
      style={cardStyle}
    >
      {/* Status beacon */}
      {beaconColor ? (
        <span className="absolute right-4 top-4 flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full animate-status-beacon rounded-full opacity-75 ${beaconColor}`}
          />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${beaconColor}`} />
        </span>
      ) : null}

      {/* Project color accent bar */}
      <div
        className="h-1 rounded-t-[24px] transition-all duration-300 group-hover:h-[5px]"
        style={{ backgroundColor: tint }}
      />

      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="flex-1 text-base font-semibold leading-snug text-slate-900">
            {task.title}
          </h4>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              priorityStyles[task.priority]
            }`}
          >
            {TASK_PRIORITY_LABELS[task.priority]}
          </span>
        </div>

        {/* Due date */}
        {dueDateInfo ? (
          <p
            className={`mt-2 flex items-center gap-1 text-xs ${
              isOverdueActive
                ? "font-semibold text-rose-500"
                : "text-slate-400"
            }`}
          >
            <svg
              className="h-3 w-3 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect height="18" rx="2" width="18" x="3" y="4" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            {dueDateInfo.label}
            {isOverdueActive ? " · Overdue" : ""}
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-300">No due date</p>
        )}

        {/* Description */}
        {task.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">
            {task.description}
          </p>
        ) : (
          <p className="mt-3 text-xs italic text-slate-300">No description</p>
        )}

        {/* Footer: status select + actions */}
        <div className="mt-4 flex items-center gap-2">
          <select
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-700 shadow-none transition focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 disabled:opacity-50"
            disabled={isBusy}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            value={task.status}
          >
            {TASK_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <button
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-40"
            disabled={isBusy}
            onClick={() => onEdit(task)}
            type="button"
          >
            Edit
          </button>

          <button
            className="rounded-xl border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 hover:border-rose-200 disabled:opacity-40"
            disabled={isBusy}
            onClick={() => onDelete(task)}
            type="button"
          >
            {isBusy ? "…" : "Del"}
          </button>
        </div>
      </div>
    </article>
  );
}
