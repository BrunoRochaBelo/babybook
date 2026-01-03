type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

type ApiErrorShape =
  | { message?: unknown }
  | { error?: { message?: unknown } }
  | Record<string, unknown>;

const enableMocksFlag = (
  import.meta.env.VITE_ENABLE_MSW ??
  (import.meta.env.DEV || import.meta.env.MODE === "test" ? "true" : "false")
)
  .toString()
  .toLowerCase();

const shouldForceLocal = enableMocksFlag !== "false";

function resolveBaseUrl() {
  if (shouldForceLocal) return "/api";
  const raw = (import.meta.env.VITE_API_BASE_URL ?? "").toString().trim();
  if (raw.length === 0) return "/api";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

const baseURL = resolveBaseUrl();

async function readErrorMessage(res: Response): Promise<string> {
  const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
  try {
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as ApiErrorShape;
      const direct =
        typeof (data as { message?: unknown }).message === "string"
          ? ((data as { message?: string }).message ?? "")
          : "";
      const nested =
        typeof (data as { error?: { message?: unknown } }).error?.message ===
        "string"
          ? ((data as { error?: { message?: string } }).error?.message ?? "")
          : "";
      const msg = (direct || nested).toString().trim();
      if (msg) return msg;
      return "";
    }

    const text = await res.text();
    // Se veio JSON como texto, tentamos extrair message
    if (text.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(text) as ApiErrorShape;
        const msg =
          typeof (parsed as { message?: unknown }).message === "string"
            ? ((parsed as { message?: string }).message ?? "")
            : typeof (parsed as { error?: { message?: unknown } }).error
                  ?.message === "string"
              ? ((parsed as { error?: { message?: string } }).error?.message ??
                "")
              : "";
        return msg.toString().trim();
      } catch {
        // ignore
      }
    }
    return text.toString().trim();
  } catch {
    return "";
  }
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}) {
  const url = `${baseURL}${path}`;

  const res = await fetch(url, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const message = await readErrorMessage(res);
    const err = new Error(message || `HTTP ${res.status}`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
