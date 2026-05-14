import type { CSSProperties } from "react";
import { EmptyState } from "./EmptyState";
import { TaskCard } from "./TaskCard";
import type { Project, Task, TaskStatus } from "../types";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "../types";

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
    (collection, status) => {
      collection[status] = tasks.filter((task) => task.status === status);
      return collection;
    },
    {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    },
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-4">
        {TASK_STATUS_ORDER.map((status) => (
          <section key={status} className="surface-card p-4">
            <div className="h-7 w-28 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-4 space-y-4">
              <div className="h-40 animate-pulse rounded-[24px] bg-slate-100" />
              <div className="h-32 animate-pulse rounded-[24px] bg-slate-100" />
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
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
      {TASK_STATUS_ORDER.map((status, index) => {
        const columnStyle: CSSProperties = {
          background: `linear-gradient(180deg, ${hexToRgba(project.color, 0.08)}, rgba(255,255,255,0.92))`,
          animationDelay: `${index * 80}ms`,
        };

        return (
          <section
            key={status}
            className="animate-float-in rounded-[30px] border border-white/80 p-4 shadow-soft"
            style={columnStyle}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl text-slate-900">{TASK_STATUS_LABELS[status]}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {groupedTasks[status].length} task
                  {groupedTasks[status].length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {groupedTasks[status].length ? (
              <div className="space-y-4">
                {groupedTasks[status].map((task) => (
                  <TaskCard
                    isBusy={busyTaskId === task.id}
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
              <EmptyState
                compact
                description={`Move work into ${TASK_STATUS_LABELS[status].toLowerCase()} when it belongs here.`}
                title={`Nothing in ${TASK_STATUS_LABELS[status].toLowerCase()}`}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
