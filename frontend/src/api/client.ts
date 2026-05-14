import type {
  AuthResponse,
  LoginInput,
  Project,
  ProjectInput,
  RegisterInput,
  Task,
  TaskInput,
  TaskUpdateInput,
  User,
} from "../types";

const configuredBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:8080";

const runtimeBaseUrl = import.meta.env.DEV ? "" : configuredBaseUrl;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${runtimeBaseUrl}${path}`, {
    ...options,
    headers,
    body,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Ignore JSON parsing failures for non-JSON error bodies.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export function getApiBaseUrl() {
  return configuredBaseUrl;
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong.",
) {
  return error instanceof Error ? error.message : fallback;
}

export const api = {
  register(payload: RegisterInput) {
    return request<User>("/api/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  login(payload: LoginInput) {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  me(token: string) {
    return request<User>("/api/me", { method: "GET" }, token);
  },

  listProjects(token: string) {
    return request<{ projects: Project[] }>("/api/projects", { method: "GET" }, token)
      .then((response) => response.projects);
  },

  createProject(token: string, payload: ProjectInput) {
    return request<Project>(
      "/api/projects",
      {
        method: "POST",
        body: payload,
      },
      token,
    );
  },

  updateProject(token: string, projectId: string, payload: Partial<ProjectInput>) {
    return request<Project>(
      `/api/projects/${projectId}`,
      {
        method: "PATCH",
        body: payload,
      },
      token,
    );
  },

  deleteProject(token: string, projectId: string) {
    return request<{ status: string }>(
      `/api/projects/${projectId}`,
      {
        method: "DELETE",
      },
      token,
    );
  },

  listTasks(token: string, projectId: string) {
    return request<{ tasks: Task[] }>(
      `/api/projects/${projectId}/tasks`,
      { method: "GET" },
      token,
    ).then((response) => response.tasks);
  },

  createTask(token: string, projectId: string, payload: TaskInput) {
    return request<Task>(
      `/api/projects/${projectId}/tasks`,
      {
        method: "POST",
        body: payload,
      },
      token,
    );
  },

  updateTask(token: string, taskId: string, payload: TaskUpdateInput) {
    return request<Task>(
      `/api/tasks/${taskId}`,
      {
        method: "PATCH",
        body: payload,
      },
      token,
    );
  },

  deleteTask(token: string, taskId: string) {
    return request<{ status: string }>(
      `/api/tasks/${taskId}`,
      {
        method: "DELETE",
      },
      token,
    );
  },
};
