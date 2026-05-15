import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { ProjectInput } from "../types";

interface ProjectFormProps {
  mode: "create" | "edit";
  initialValues?: ProjectInput;
  isSaving: boolean;
  error?: string | null;
  onSubmit: (values: ProjectInput) => void | Promise<void>;
  onCancel: () => void;
}

const defaultColor = "#0f766e";

function Spinner() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ProjectForm({
  mode,
  initialValues,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [color, setColor] = useState(initialValues?.color || defaultColor);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initialValues?.title || "");
    setDescription(initialValues?.description || "");
    setColor(initialValues?.color || defaultColor);
    setLocalError(null);
  }, [initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setLocalError("Project title is required.");
      return;
    }

    setLocalError(null);
    await onSubmit({
      title: normalizedTitle,
      description: description.trim(),
      color: color.trim() || defaultColor,
    });
  }

  return (
    <div className="modal-overlay">
      <div className="surface-card w-full max-w-xl animate-scale-in p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">
              {mode === "create" ? "New project" : "Edit project"}
            </p>
            <h2 className="mt-2 text-3xl">
              {mode === "create" ? "Shape a fresh workspace" : "Refine project details"}
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
              maxLength={150}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Website redesign"
              value={title}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </span>
            <textarea
              className="soft-input min-h-28 resize-none"
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short context for this project..."
              value={description}
            />
          </label>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">Color</span>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-all duration-200 focus-within:border-teal-300">
              <input
                className="h-14 w-20 cursor-pointer rounded-xl border border-slate-200 bg-white p-1 transition-transform duration-200 hover:scale-105"
                onChange={(event) => setColor(event.target.value)}
                type="color"
                value={color}
              />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm font-medium text-slate-700">{color}</div>
                <p className="mt-1 text-sm text-slate-500">
                  The project tint appears in the sidebar, header, and task board accents.
                </p>
              </div>
              {/* Live color swatch */}
              <div
                className="h-10 w-10 flex-shrink-0 rounded-full shadow-sm transition-all duration-300"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>

          {localError || error ? (
            <div className="animate-fade-up rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
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
              {isSaving ? (
                <>
                  <Spinner />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : mode === "create" ? (
                "Create project"
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
