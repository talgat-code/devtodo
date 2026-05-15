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
        {TASK_STATUS_ORDER.map((status, index) => (
          <section key={status} className="surface-card p-4" style={{ animationDelay: `${index * 60}ms` }}>
            <div className="shimmer-skeleton mb-4 h-7 w-28 rounded-full" />
            <div className="mt-4 space-y-4">
              <div className="shimmer-skeleton h-40 rounded-[24px]" />
              <div className="shimmer-skeleton h-32 rounded-[24px]" />
              <div className="shimmer-skeleton h-24 rounded-[24px]" />
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
        const columnStyle: CSSProperties = {
          background: `linear-gradient(180deg, ${hexToRgba(project.color, 0.08)}, rgba(255,255,255,0.92))`,
          animationDelay: `${columnIndex * 80}ms`,
        };

        const columnTasks = groupedTasks[status];
        const hasWork = columnTasks.length > 0;

        return (
          <section
            key={status}
            className="animate-float-in rounded-[30px] border border-white/80 p-4 shadow-soft transition-shadow duration-300 hover:shadow-glow/30"
            style={columnStyle}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl text-slate-900">{TASK_STATUS_LABELS[status]}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  <span className="animate-count-pop inline-block font-semibold text-slate-700">
                    {columnTasks.length}
                  </span>{" "}
                  task{columnTasks.length === 1 ? "" : "s"}
                </p>
              </div>

              {/* Column status dot */}
              {hasWork ? (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: hexToRgba(project.color, 0.9) }}
                />
              ) : null}
            </div>

            {hasWork ? (
              <div className="space-y-4">
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
