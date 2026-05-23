import type { CSSProperties } from "react";
import { EmptyState } from "./EmptyState";
import { TaskCard } from "./TaskCard";
import type { Project, Task, TaskStatus } from "../types";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "../types";
import { hexToRgba } from "../utils";

interface TaskBoardProps {
  project: Project;
  tasks: Task[];
  isLoading: boolean;
  error?: string | null;
  busyTaskId?: string | null;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const statusAccent: Record<TaskStatus, string> = {
  todo: "#94a3b8",
  in_progress: "#38bdf8",
  review: "#fbbf24",
  done: "#34d399",
};

const statusBg: Record<TaskStatus, string> = {
  todo: "rgba(148,163,184,0.1)",
  in_progress: "rgba(56,189,248,0.08)",
  review: "rgba(251,191,36,0.08)",
  done: "rgba(52,211,153,0.08)",
};

export function TaskBoard({
  project,
  tasks,
  isLoading,
  error,
  busyTaskId,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}: TaskBoardProps) {
  const groupedTasks = TASK_STATUS_ORDER.reduce<Record<TaskStatus, Task[]>>(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    { todo: [], in_progress: [], review: [], done: [] },
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-4">
        {TASK_STATUS_ORDER.map((status, i) => (
          <section
            className="overflow-hidden rounded-[28px] border border-white/80 shadow-soft"
            key={status}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="shimmer-skeleton h-1.5 w-full" />
            <div className="p-4">
              <div className="shimmer-skeleton mb-5 h-6 w-24 rounded-full" />
              <div className="space-y-3">
                <div className="shimmer-skeleton h-36 rounded-[20px]" />
                <div className="shimmer-skeleton h-28 rounded-[20px]" />
              </div>
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-up rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <EmptyState
        actionLabel="Create first task"
        description="This project is ready for its first task. Add one and the board will organize it by status automatically."
        onAction={onCreateTask}
        title="No tasks yet"
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {TASK_STATUS_ORDER.map((status, columnIndex) => {
        const columnTasks = groupedTasks[status];
        const accent = statusAccent[status];
        const bg = statusBg[status];
        const projectTint = hexToRgba(project.color, 0.06);

        const columnStyle: CSSProperties = {
          background: `linear-gradient(180deg, ${bg}, rgba(255,255,255,0.94))`,
          animationDelay: `${columnIndex * 70}ms`,
        };

        return (
          <section
            className="animate-float-in overflow-hidden rounded-[28px] border border-white/80 shadow-soft transition-shadow duration-300"
            key={status}
            style={columnStyle}
          >
            {/* Status accent bar */}
            <div
              className="h-1 w-full transition-all duration-500"
              style={{ backgroundColor: accent }}
            />

            {/* Column header */}
            <div className="flex items-center justify-between px-4 pb-3 pt-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: accent }}
                />
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {TASK_STATUS_LABELS[status]}
                </h3>
              </div>
              <span
                className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-bold"
                style={{
                  backgroundColor: columnTasks.length
                    ? hexToRgba(project.color, 0.12)
                    : "rgba(148,163,184,0.12)",
                  color: columnTasks.length ? project.color : "#94a3b8",
                }}
              >
                {columnTasks.length}
              </span>
            </div>

            {/* Tasks or empty placeholder */}
            <div className="px-3 pb-3">
              {columnTasks.length > 0 ? (
                <div className="space-y-3">
                  {columnTasks.map((task, taskIndex) => (
                    <TaskCard
                      isBusy={busyTaskId === task.id}
                      index={taskIndex}
                      key={task.id}
                      onDelete={onDeleteTask}
                      onEdit={onEditTask}
                      onStatusChange={onStatusChange}
                      projectColor={project.color}
                      task={task}
                    />
                  ))}
                </div>
              ) : (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-slate-200/80 py-8 text-sm text-slate-400 transition hover:border-slate-300 hover:text-slate-500"
                  onClick={onCreateTask}
                  type="button"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    +
                  </span>
                  Add task
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
