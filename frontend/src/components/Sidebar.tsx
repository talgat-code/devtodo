import type { CSSProperties } from "react";
import { EmptyState } from "./EmptyState";
import type { Project } from "../types";
import { hexToRgba } from "../utils";

interface SidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
}

export function Sidebar({
  projects,
  selectedProjectId,
  isLoading,
  onSelectProject,
  onCreateProject,
}: SidebarProps) {
  return (
    <aside className="surface-card animate-float-in p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">
            Workspace
          </p>
          <h2 className="mt-3 text-3xl">Projects</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Keep your plans tidy, colorful, and easy to revisit.
          </p>
        </div>
        <button className="primary-button px-4 py-2.5" onClick={onCreateProject} type="button">
          New
        </button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className="shimmer-skeleton h-24 rounded-[24px]"
                key={`project-skeleton-${index}`}
              />
            ))}
          </div>
        ) : projects.length ? (
          <div className="space-y-3">
            {projects.map((project, index) => {
              const isSelected = selectedProjectId === project.id;
              const cardStyle: CSSProperties = {
                animationDelay: `${index * 55}ms`,
                ...(isSelected
                  ? {
                      background: `linear-gradient(135deg, ${hexToRgba(
                        project.color || "#0f766e",
                        0.18,
                      )}, rgba(255,255,255,0.95))`,
                      borderColor: hexToRgba(project.color || "#0f766e", 0.24),
                      boxShadow: `0 18px 38px ${hexToRgba(
                        project.color || "#0f766e",
                        0.16,
                      )}`,
                    }
                  : {}),
              };

              return (
                <button
                  className={`animate-slide-left w-full rounded-[26px] border p-4 text-left transition-all duration-300 ${
                    isSelected
                      ? "translate-x-1.5 border-white/80"
                      : "border-slate-200 bg-white/80 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                  }`}
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  style={cardStyle}
                  type="button"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 rounded-full transition-all duration-300 ${
                        isSelected ? "h-4 w-4" : "h-3.5 w-3.5"
                      }`}
                      style={{ backgroundColor: project.color || "#0f766e" }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-semibold text-slate-900">
                        {project.title}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {project.description || "No description yet."}
                      </p>
                    </div>
                    {isSelected ? (
                      <span className="mt-1 flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Active
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            compact
            actionLabel="Create a project"
            description="Add your first project to start organizing tasks by theme, client, sprint, or goal."
            onAction={onCreateProject}
            title="Your list is empty"
          />
        )}
      </div>
    </aside>
  );
}
