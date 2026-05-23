import { useEffect, useState } from "react";
import { api, getErrorMessage, isUnauthorizedError } from "../api/client";
import type { Project, ProjectInput, Task, TaskInput, TaskStatus, User } from "../types";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "../types";
import { hexToRgba } from "../utils";
import { EmptyState } from "./EmptyState";
import { ProjectForm } from "./ProjectForm";
import { Sidebar } from "./Sidebar";
import { TaskBoard } from "./TaskBoard";
import { TaskForm } from "./TaskForm";

interface DashboardProps {
  token: string;
  user: User;
  onLogout: () => void;
  onUnauthorized: () => void;
  onGoToCanvas: () => void;
}

function countTasksByStatus(tasks: Task[], status: TaskStatus) {
  return tasks.filter((task) => task.status === status).length;
}

export function Dashboard({
  token,
  user,
  onLogout,
  onUnauthorized,
  onGoToCanvas,
}: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectFormError, setProjectFormError] = useState<string | null>(null);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) || null;

  function resolveError(error: unknown, fallback: string) {
    if (isUnauthorizedError(error)) {
      onUnauthorized();
      return null;
    }

    return getErrorMessage(error, fallback);
  }

  useEffect(() => {
    let isActive = true;

    async function loadProjects() {
      setIsLoadingProjects(true);
      setPageError(null);

      try {
        const nextProjects = await api.listProjects(token);
        if (!isActive) {
          return;
        }

        setProjects(nextProjects);
        setSelectedProjectId((currentProjectId) => {
          if (!nextProjects.length) {
            return null;
          }

          if (
            currentProjectId &&
            nextProjects.some((project) => project.id === currentProjectId)
          ) {
            return currentProjectId;
          }

          return nextProjects[0].id;
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setPageError(resolveError(error, "Could not load projects."));
      } finally {
        if (isActive) {
          setIsLoadingProjects(false);
        }
      }
    }

    loadProjects();

    return () => {
      isActive = false;
    };
  }, [token]);

  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      setTaskError(null);
      setIsLoadingTasks(false);
      return;
    }

    let isActive = true;

    async function loadTasks(activeProjectId: string) {
      setIsLoadingTasks(true);
      setTaskError(null);

      try {
        const nextTasks = await api.listTasks(token, activeProjectId);
        if (!isActive) {
          return;
        }

        setTasks(nextTasks);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setTaskError(resolveError(error, "Could not load tasks."));
      } finally {
        if (isActive) {
          setIsLoadingTasks(false);
        }
      }
    }

    loadTasks(selectedProjectId);

    return () => {
      isActive = false;
    };
  }, [selectedProjectId, token]);

  async function handleProjectSubmit(values: ProjectInput) {
    setIsSavingProject(true);
    setProjectFormError(null);

    try {
      if (projectToEdit) {
        const updatedProject = await api.updateProject(token, projectToEdit.id, values);
        setProjects((currentProjects) =>
          currentProjects.map((project) =>
            project.id === updatedProject.id ? updatedProject : project,
          ),
        );
      } else {
        const createdProject = await api.createProject(token, values);
        setProjects((currentProjects) => [createdProject, ...currentProjects]);
        setTasks([]);
        setSelectedProjectId(createdProject.id);
      }

      setIsProjectFormOpen(false);
      setProjectToEdit(null);
    } catch (error) {
      setProjectFormError(resolveError(error, "Could not save project."));
    } finally {
      setIsSavingProject(false);
    }
  }

  async function handleDeleteProject() {
    if (!selectedProject) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${selectedProject.title}" and its tasks? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setIsDeletingProject(true);
    setPageError(null);

    try {
      await api.deleteProject(token, selectedProject.id);
      const nextProjects = projects.filter((project) => project.id !== selectedProject.id);
      setProjects(nextProjects);
      setSelectedProjectId(nextProjects[0]?.id || null);
      setTasks([]);
    } catch (error) {
      setPageError(resolveError(error, "Could not delete project."));
    } finally {
      setIsDeletingProject(false);
    }
  }

  async function handleTaskSubmit(values: TaskInput) {
    if (!selectedProjectId) {
      return;
    }

    setIsSavingTask(true);
    setTaskFormError(null);

    try {
      if (taskToEdit) {
        const updatedTask = await api.updateTask(token, taskToEdit.id, values);
        setTasks((currentTasks) =>
          currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
        );
      } else {
        const createdTask = await api.createTask(token, selectedProjectId, values);
        setTasks((currentTasks) => [createdTask, ...currentTasks]);
      }

      setTaskToEdit(null);
      setIsTaskFormOpen(false);
    } catch (error) {
      setTaskFormError(resolveError(error, "Could not save task."));
    } finally {
      setIsSavingTask(false);
    }
  }

  async function handleDeleteTask(task: Task) {
    const confirmed = window.confirm(`Delete "${task.title}"?`);
    if (!confirmed) {
      return;
    }

    setBusyTaskId(task.id);
    setTaskError(null);

    try {
      await api.deleteTask(token, task.id);
      setTasks((currentTasks) => currentTasks.filter((item) => item.id !== task.id));
    } catch (error) {
      setTaskError(resolveError(error, "Could not delete task."));
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === status) {
      return;
    }

    setBusyTaskId(taskId);
    setTaskError(null);

    try {
      const updatedTask = await api.updateTask(token, taskId, { status });
      setTasks((currentTasks) =>
        currentTasks.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
      );
    } catch (error) {
      setTaskError(resolveError(error, "Could not update task status."));
    } finally {
      setBusyTaskId(null);
    }
  }

  function openCreateProjectForm() {
    setProjectToEdit(null);
    setProjectFormError(null);
    setIsProjectFormOpen(true);
  }

  function openEditProjectForm() {
    if (!selectedProject) {
      return;
    }

    setProjectToEdit(selectedProject);
    setProjectFormError(null);
    setIsProjectFormOpen(true);
  }

  function openCreateTaskForm() {
    setTaskToEdit(null);
    setTaskFormError(null);
    setIsTaskFormOpen(true);
  }

  function openEditTaskForm(task: Task) {
    setTaskToEdit(task);
    setTaskFormError(null);
    setIsTaskFormOpen(true);
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 sm:py-6">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-[8%] h-64 w-64 animate-slow-pulse rounded-full bg-teal-100/60 blur-3xl" />
        <div
          className="absolute bottom-[10%] right-[8%] h-72 w-72 animate-slow-pulse rounded-full bg-coral-100/60 blur-3xl"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute left-[40%] top-[50%] h-48 w-48 animate-slow-pulse rounded-full bg-amber-100/40 blur-3xl"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="relative mx-auto max-w-[1600px] xl:grid xl:grid-cols-[320px,minmax(0,1fr)] xl:gap-6">
        <Sidebar
          isLoading={isLoadingProjects}
          onCreateProject={openCreateProjectForm}
          onSelectProject={(projectId) => {
            setTasks([]);
            setSelectedProjectId(projectId);
          }}
          projects={projects}
          selectedProjectId={selectedProjectId}
        />

        <section className="mt-6 xl:mt-0">
          {/* Header card */}
          <header className="surface-card animate-float-in p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">
                  Dashboard
                </p>
                <h1 className="mt-3 text-4xl text-slate-900">
                  Hello,{" "}
                  <span className="animate-fade-up inline-block" style={{ animationDelay: "150ms" }}>
                    {user.name.split(" ")[0] || user.name}
                  </span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  Keep projects moving with a focused board, gentle visual structure,
                  and quick updates for every task.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                  <span className="block font-semibold text-slate-900">{user.name}</span>
                  <span>{user.email}</span>
                </div>
                <button
                  className="secondary-button"
                  onClick={onGoToCanvas}
                  type="button"
                >
                  Canvas view
                </button>
                <button className="secondary-button" onClick={onLogout} type="button">
                  Logout
                </button>
              </div>
            </div>
          </header>

          {pageError ? (
            <div className="mt-4 animate-fade-up rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {pageError}
            </div>
          ) : null}

          {selectedProject ? (
            <>
              {/* Project info card */}
              <section
                className="surface-card mt-4 animate-float-in overflow-hidden"
                style={{
                  boxShadow: `0 20px 50px ${hexToRgba(selectedProject.color, 0.14)}`,
                  animationDelay: "80ms",
                }}
              >
                {/* Project color accent line */}
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: selectedProject.color || "#0f766e" }}
                />

                <div className="p-5 sm:p-6">
                  {/* Top row: title + actions */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 animate-pop-in rounded-full shadow-sm"
                        style={{ backgroundColor: selectedProject.color || "#0f766e" }}
                      />
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                        Active project
                      </p>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-2">
                      <button
                        className="primary-button px-4 py-2.5 text-sm"
                        onClick={openCreateTaskForm}
                        type="button"
                      >
                        + Add task
                      </button>
                      <button
                        className="secondary-button px-4 py-2.5 text-sm"
                        onClick={openEditProjectForm}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-2xl border border-rose-100 px-4 py-2.5 text-sm font-semibold text-rose-500 transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isDeletingProject}
                        onClick={handleDeleteProject}
                        type="button"
                      >
                        {isDeletingProject ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>

                  {/* Title + description */}
                  <h2 className="mt-3 text-3xl text-slate-900">{selectedProject.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {selectedProject.description ||
                      "Add a short description to make this workspace easier to scan later."}
                  </p>

                  {/* Status stats row */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {TASK_STATUS_ORDER.map((status, i) => {
                      const count = countTasksByStatus(tasks, status);
                      const accent = ["#94a3b8", "#38bdf8", "#fbbf24", "#34d399"][i];
                      return (
                        <div
                          className="animate-fade-up flex items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-3.5 py-2 shadow-sm"
                          key={status}
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: accent }}
                          />
                          <span className="text-sm font-bold text-slate-900">{count}</span>
                          <span className="text-xs text-slate-500">
                            {TASK_STATUS_LABELS[status].toLowerCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="mt-4">
                <TaskBoard
                  busyTaskId={busyTaskId}
                  error={taskError}
                  isLoading={isLoadingTasks}
                  onCreateTask={openCreateTaskForm}
                  onDeleteTask={handleDeleteTask}
                  onEditTask={openEditTaskForm}
                  onStatusChange={handleStatusChange}
                  project={selectedProject}
                  tasks={tasks}
                />
              </section>
            </>
          ) : isLoadingProjects ? (
            <section className="surface-card mt-4 p-8">
              <div className="shimmer-skeleton mb-4 h-10 w-56 rounded-full" />
              <div className="shimmer-skeleton h-6 w-80 rounded-full" />
              <div className="mt-8 grid gap-4 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    className="shimmer-skeleton h-48 rounded-[30px]"
                    key={`board-skeleton-${index}`}
                  />
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-4">
              <EmptyState
                actionLabel="Create a project"
                description="Once you create a project, this area becomes your task board with grouped columns and quick edits."
                onAction={openCreateProjectForm}
                title="Choose or create a project"
              />
            </section>
          )}
        </section>
      </div>

      {isProjectFormOpen ? (
        <ProjectForm
          error={projectFormError}
          initialValues={
            projectToEdit
              ? {
                  title: projectToEdit.title,
                  description: projectToEdit.description,
                  color: projectToEdit.color || "#0f766e",
                }
              : undefined
          }
          isSaving={isSavingProject}
          mode={projectToEdit ? "edit" : "create"}
          onCancel={() => {
            setIsProjectFormOpen(false);
            setProjectToEdit(null);
          }}
          onSubmit={handleProjectSubmit}
        />
      ) : null}

      {isTaskFormOpen ? (
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
      ) : null}
    </main>
  );
}
