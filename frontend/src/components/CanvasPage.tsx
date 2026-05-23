import { useEffect, useRef, useState } from "react";
import { api, getErrorMessage, isUnauthorizedError } from "../api/client";
import type { Project, Task, TaskInput, TaskStatus, User } from "../types";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "../types";
import { TaskForm } from "./TaskForm";

interface CanvasPageProps {
  token: string;
  user: User;
  onLogout: () => void;
  onUnauthorized: () => void;
  onGoToDashboard: () => void;
}

interface Position {
  x: number;
  y: number;
}

type PositionMap = Record<string, Position>;

const CARD_WIDTH = 248;

const priorityPill: Record<Task["priority"], string> = {
  low: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  medium: "bg-sky-50 text-sky-700 border border-sky-100",
  high: "bg-amber-50 text-amber-700 border border-amber-100",
  urgent: "bg-rose-50 text-rose-700 border border-rose-100",
};

const statusPill: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-600",
  in_progress: "bg-sky-100 text-sky-700",
  review: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
};

function posKey(userId: string, projectId: string) {
  return `devtodo.canvas.${userId}.${projectId}`;
}

function loadPositions(userId: string, projectId: string): PositionMap {
  try {
    const raw = localStorage.getItem(posKey(userId, projectId));
    return raw ? (JSON.parse(raw) as PositionMap) : {};
  } catch {
    return {};
  }
}

function savePositions(userId: string, projectId: string, positions: PositionMap) {
  try {
    localStorage.setItem(posKey(userId, projectId), JSON.stringify(positions));
  } catch {}
}

function defaultPosition(index: number): Position {
  const cols = 4;
  return {
    x: 60 + (index % cols) * 290,
    y: 60 + Math.floor(index / cols) * 220,
  };
}

export function CanvasPage({
  token,
  user,
  onLogout,
  onUnauthorized,
  onGoToDashboard,
}: CanvasPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const [positions, setPositions] = useState<PositionMap>({});
  const positionsRef = useRef<PositionMap>({});

  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const isDraggingCard = useRef(false);

  const dragState = useRef<{
    taskId: string;
    startMouseX: number;
    startMouseY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const panState = useRef<{
    startMouseX: number;
    startMouseY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  function resolveError(error: unknown, fallback: string): string | null {
    if (isUnauthorizedError(error)) {
      onUnauthorized();
      return null;
    }
    return getErrorMessage(error, fallback);
  }

  useEffect(() => {
    let active = true;
    setIsLoadingProjects(true);
    api
      .listProjects(token)
      .then((list) => {
        if (!active) return;
        setProjects(list);
        setSelectedProjectId(list[0]?.id ?? null);
      })
      .catch((err) => {
        if (active) resolveError(err, "Could not load projects.");
      })
      .finally(() => {
        if (active) setIsLoadingProjects(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }

    let active = true;
    setIsLoadingTasks(true);

    api
      .listTasks(token, selectedProjectId)
      .then((list) => {
        if (!active) return;
        setTasks(list);
        const saved = loadPositions(user.id, selectedProjectId);
        const resolved: PositionMap = {};
        list.forEach((task, i) => {
          resolved[task.id] = saved[task.id] ?? defaultPosition(i);
        });
        positionsRef.current = resolved;
        setPositions({ ...resolved });
      })
      .catch((err) => {
        if (active) resolveError(err, "Could not load tasks.");
      })
      .finally(() => {
        if (active) setIsLoadingTasks(false);
      });

    return () => {
      active = false;
    };
  }, [selectedProjectId, token, user.id]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (dragState.current) {
        isDraggingCard.current = true;
        const { taskId, startMouseX, startMouseY, startPosX, startPosY } =
          dragState.current;
        const dx = (e.clientX - startMouseX) / zoomRef.current;
        const dy = (e.clientY - startMouseY) / zoomRef.current;
        const newPos = { x: startPosX + dx, y: startPosY + dy };
        positionsRef.current = { ...positionsRef.current, [taskId]: newPos };
        setPositions({ ...positionsRef.current });
      } else if (panState.current) {
        const { startMouseX, startMouseY, startOffsetX, startOffsetY } =
          panState.current;
        const newOffset = {
          x: startOffsetX + (e.clientX - startMouseX),
          y: startOffsetY + (e.clientY - startMouseY),
        };
        offsetRef.current = newOffset;
        setOffset({ ...newOffset });
      }
    }

    function onMouseUp() {
      if (dragState.current && selectedProjectId) {
        savePositions(user.id, selectedProjectId, positionsRef.current);
      }
      dragState.current = null;
      panState.current = null;
      setTimeout(() => {
        isDraggingCard.current = false;
      }, 0);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [selectedProjectId, user.id]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = viewport!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.91;
      const newZoom = Math.min(2.5, Math.max(0.2, zoomRef.current * factor));
      const worldX = (mouseX - offsetRef.current.x) / zoomRef.current;
      const worldY = (mouseY - offsetRef.current.y) / zoomRef.current;
      const newOffset = {
        x: mouseX - worldX * newZoom,
        y: mouseY - worldY * newZoom,
      };
      zoomRef.current = newZoom;
      offsetRef.current = newOffset;
      setZoom(newZoom);
      setOffset({ ...newOffset });
    }

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, []);

  function startCardDrag(e: React.MouseEvent, task: Task) {
    e.stopPropagation();
    const pos = positionsRef.current[task.id] ?? defaultPosition(0);
    dragState.current = {
      taskId: task.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
  }

  function startPan(e: React.MouseEvent) {
    if (dragState.current) return;
    panState.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startOffsetX: offsetRef.current.x,
      startOffsetY: offsetRef.current.y,
    };
  }

  function resetView() {
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function openCreateTask() {
    setTaskToEdit(null);
    setTaskFormError(null);
    setIsTaskFormOpen(true);
  }

  function openEditTask(task: Task) {
    setTaskToEdit(task);
    setTaskFormError(null);
    setIsTaskFormOpen(true);
  }

  async function handleTaskSubmit(values: TaskInput) {
    if (!selectedProjectId) return;
    setIsSavingTask(true);
    setTaskFormError(null);
    try {
      if (taskToEdit) {
        const updated = await api.updateTask(token, taskToEdit.id, values);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await api.createTask(token, selectedProjectId, values);
        const vp = viewportRef.current;
        const cx = vp ? vp.clientWidth / 2 : 600;
        const cy = vp ? vp.clientHeight / 2 : 400;
        const newPos = {
          x: (cx - offsetRef.current.x) / zoomRef.current - CARD_WIDTH / 2,
          y: (cy - offsetRef.current.y) / zoomRef.current - 80,
        };
        positionsRef.current = { ...positionsRef.current, [created.id]: newPos };
        setPositions({ ...positionsRef.current });
        savePositions(user.id, selectedProjectId, positionsRef.current);
        setTasks((prev) => [created, ...prev]);
      }
      setIsTaskFormOpen(false);
      setTaskToEdit(null);
    } catch (err) {
      setTaskFormError(resolveError(err, "Could not save task.") ?? "Error saving task.");
    } finally {
      setIsSavingTask(false);
    }
  }

  async function handleDeleteTask(task: Task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    setBusyTaskId(task.id);
    try {
      await api.deleteTask(token, task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      const { [task.id]: _removed, ...rest } = positionsRef.current;
      positionsRef.current = rest;
      setPositions({ ...rest });
      if (selectedProjectId) savePositions(user.id, selectedProjectId, rest);
    } catch (err) {
      resolveError(err, "Could not delete task.");
    } finally {
      setBusyTaskId(null);
    }
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950" style={{ userSelect: "none" }}>
      {/* ── Top bar ── */}
      <header className="flex shrink-0 items-center gap-2 border-b border-slate-700/50 bg-slate-900/90 px-4 py-2.5 backdrop-blur-sm">
        <span className="mr-1 text-sm font-bold tracking-tight text-white">DevToDo</span>
        <span className="text-slate-700">·</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-teal-400">Canvas</span>

        <div className="mx-2 h-4 w-px bg-slate-700" />

        {/* Project selector */}
        <select
          className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          disabled={isLoadingProjects}
          onChange={(e) => {
            setTasks([]);
            setSelectedProjectId(e.target.value || null);
          }}
          value={selectedProjectId ?? ""}
        >
          {isLoadingProjects && <option>Loading…</option>}
          {!isLoadingProjects && projects.length === 0 && (
            <option value="">No projects</option>
          )}
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        {selectedProject && (
          <span
            className="h-2.5 w-2.5 rounded-full ring-1 ring-white/20"
            style={{ backgroundColor: selectedProject.color }}
          />
        )}

        {/* Add task */}
        <button
          className="ml-1 rounded-xl bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!selectedProjectId || isLoadingTasks}
          onClick={openCreateTask}
          type="button"
        >
          + Add task
        </button>

        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center divide-x divide-slate-600 overflow-hidden rounded-xl border border-slate-600 bg-slate-800">
          <button
            className="px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition"
            onClick={() => {
              const z = Math.max(0.2, zoomRef.current * 0.85);
              zoomRef.current = z;
              setZoom(z);
            }}
            type="button"
          >
            −
          </button>
          <span className="w-14 px-2 py-1.5 text-center text-xs text-slate-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition"
            onClick={() => {
              const z = Math.min(2.5, zoomRef.current * 1.15);
              zoomRef.current = z;
              setZoom(z);
            }}
            type="button"
          >
            +
          </button>
        </div>

        <button
          className="rounded-xl border border-slate-600 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-400 hover:text-slate-200"
          onClick={resetView}
          type="button"
        >
          Reset
        </button>

        <div className="mx-1 h-4 w-px bg-slate-700" />

        <span className="text-xs text-slate-500">{user.name}</span>

        <button
          className="rounded-xl border border-slate-600 px-3 py-1.5 text-xs text-slate-300 transition hover:border-teal-500/60 hover:text-teal-400"
          onClick={onGoToDashboard}
          type="button"
        >
          ← Dashboard
        </button>

        <button
          className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-500 transition hover:border-rose-500/50 hover:text-rose-400"
          onClick={onLogout}
          type="button"
        >
          Logout
        </button>
      </header>

      {/* ── Canvas viewport ── */}
      <div
        className="relative flex-1 overflow-hidden"
        onMouseDown={startPan}
        ref={viewportRef}
        style={{
          cursor: panState.current ? "grabbing" : "grab",
          backgroundImage: `radial-gradient(circle, rgba(148,163,184,0.12) 1px, transparent 1px)`,
          backgroundSize: `${28 * zoom}px ${28 * zoom}px`,
          backgroundPosition: `${offset.x % (28 * zoom)}px ${offset.y % (28 * zoom)}px`,
        }}
      >
        {/* World layer */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transformOrigin: "0 0",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            willChange: "transform",
          }}
        >
          {isLoadingTasks && (
            <div
              className="absolute rounded-2xl border border-slate-700 bg-slate-800/80 px-6 py-4 text-sm text-slate-400"
              style={{ left: 60, top: 60 }}
            >
              Loading tasks…
            </div>
          )}

          {!isLoadingTasks && tasks.length === 0 && selectedProjectId && (
            <div
              className="absolute rounded-2xl border-2 border-dashed border-slate-700 p-8 text-center"
              style={{ left: 60, top: 60, width: 280 }}
            >
              <p className="text-sm text-slate-400">No tasks in this project yet.</p>
              <button
                className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500"
                onClick={openCreateTask}
                onMouseDown={(e) => e.stopPropagation()}
                type="button"
              >
                Add first task
              </button>
            </div>
          )}

          {tasks.map((task) => {
            const pos = positions[task.id] ?? defaultPosition(0);
            const color = selectedProject?.color ?? "#0f766e";
            const isBusy = busyTaskId === task.id;

            return (
              <div
                key={task.id}
                className="absolute overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg transition-shadow hover:shadow-xl"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: CARD_WIDTH,
                  cursor: "default",
                }}
                onMouseDown={(e) => startCardDrag(e, task)}
              >
                {/* Drag handle bar */}
                <div
                  className="h-2 w-full cursor-grab active:cursor-grabbing"
                  style={{ backgroundColor: color }}
                />

                <div className="p-3.5">
                  <p className="text-sm font-semibold leading-snug text-slate-900">
                    {task.title}
                  </p>

                  {task.description ? (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {task.description}
                    </p>
                  ) : null}

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusPill[task.status]}`}
                    >
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityPill[task.priority]}`}
                    >
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      className="flex-1 rounded-xl bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-40"
                      disabled={isBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDraggingCard.current) openEditTask(task);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-xl border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
                      disabled={isBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDraggingCard.current) handleDeleteTask(task);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      type="button"
                    >
                      {isBusy ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hint overlay when no project */}
        {!selectedProjectId && !isLoadingProjects && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-slate-600">
              Select a project from the top bar to start.
            </p>
          </div>
        )}
      </div>

      {/* Task form modal */}
      {isTaskFormOpen && (
        <TaskForm
          error={taskFormError}
          initialTask={taskToEdit}
          isSaving={isSavingTask}
          mode={taskToEdit ? "edit" : "create"}
          onCancel={() => {
            setIsTaskFormOpen(false);
            setTaskToEdit(null);
          }}
          onSubmit={handleTaskSubmit}
        />
      )}
    </div>
  );
}
