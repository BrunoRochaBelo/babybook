interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  traceName?: string;
}

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, options: RequestOptions) {
  const response = await fetch(new URL(path, baseUrl).toString(), {
    method: options.method ?? "GET",
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      "Content-Type": "application/json",
      "X-BB-Trace": options.traceName ?? "ui.unknown"
    },
    signal: options.signal,
    credentials: "include"
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message ?? "Unexpected API error");
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, options: Omit<RequestOptions, "method"> = {}) =>
    request<T>(path, options),
  post: <T>(path: string, options: Omit<RequestOptions, "method"> = {}) =>
    request<T>(path, { ...options, method: "POST" }),
  patch: <T>(path: string, options: Omit<RequestOptions, "method"> = {}) =>
    request<T>(path, { ...options, method: "PATCH" }),
  delete: <T>(path: string, options: Omit<RequestOptions, "method"> = {}) =>
    request<T>(path, { ...options, method: "DELETE" })
};
