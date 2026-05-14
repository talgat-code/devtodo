import type { CSSProperties } from "react";
import { EmptyState } from "./EmptyState";
import type { Project } from "../types";

interface SidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
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
                className="h-24 animate-pulse rounded-[24px] bg-slate-100"
                key={`project-skeleton-${index}`}
              />
            ))}
          </div>
        ) : projects.length ? (
          <div className="space-y-3">
            {projects.map((project) => {
              const isSelected = selectedProjectId === project.id;
              const cardStyle: CSSProperties = isSelected
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
                : {};

              return (
                <button
                  className={`w-full rounded-[26px] border p-4 text-left transition ${
                    isSelected
                      ? "translate-x-1 border-white/80"
                      : "border-slate-200 bg-white/80 hover:-translate-y-0.5 hover:border-slate-300"
                  }`}
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  style={cardStyle}
                  type="button"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-3.5 w-3.5 rounded-full"
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
