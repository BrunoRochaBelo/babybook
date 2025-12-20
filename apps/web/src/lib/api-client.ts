import { z } from "zod";
import { apiErrorSchema, ApiErrorPayload } from "@babybook/contracts";
import { useAuthStore } from "../store/auth";

const rawEnableMocks = (
  import.meta.env.VITE_ENABLE_MSW ??
  (import.meta.env.DEV || import.meta.env.MODE === "test" ? "true" : "false")
)
  .toString()
  .toLowerCase();

const SHOULD_FORCE_MOCKS = rawEnableMocks !== "false";

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
const FALLBACK_BASE_PATH = "/api";

const ensureTrailingSlash = (value: string) =>
  value.endsWith("/") ? value : `${value}/`;

const buildBaseCandidates = () => {
  if (SHOULD_FORCE_MOCKS) {
    return [FALLBACK_BASE_PATH];
  }
  const candidates: string[] = [];
  if (RAW_API_BASE_URL) {
    candidates.push(RAW_API_BASE_URL);
  }
  if (!candidates.includes(FALLBACK_BASE_PATH)) {
    candidates.push(FALLBACK_BASE_PATH);
  }
  return candidates;
};

const API_BASES = buildBaseCandidates();

type SearchParams = Record<
  string,
  string | number | boolean | undefined | null
>;

interface RequestOptions<T> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  schema?: z.ZodType<T, z.ZodTypeDef, unknown>;
  searchParams?: SearchParams;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly traceId?: string;
  readonly details?: Record<string, unknown>;

  constructor(init: {
    message: string;
    status: number;
    code?: string;
    traceId?: string;
    details?: Record<string, unknown>;
  }) {
    super(init.message);
    this.status = init.status;
    this.code = init.code;
    this.traceId = init.traceId;
    this.details = init.details;
  }
}

const buildUrl = (base: string, path: string, searchParams?: SearchParams) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  let url: URL;
  if (/^https?:\/\//i.test(base)) {
    url = new URL(normalizedPath.replace(/^\//, ""), ensureTrailingSlash(base));
  } else {
    if (typeof window === "undefined" || !window.location?.origin) {
      throw new Error("Relative API base URL requires window.location");
    }
    const prefix = base.startsWith("/") ? base : `/${base}`;
    url = new URL(
      `${prefix.replace(/\/$/, "")}${normalizedPath}`,
      window.location.origin,
    );
  }

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

const parseErrorPayload = (payload: unknown): ApiErrorPayload | undefined => {
  const parsed = apiErrorSchema.safeParse(payload);
  return parsed.success ? parsed.data : undefined;
};

const handleErrorRedirects = (status: number, code?: string) => {
  if (status === 401) {
    const currentPath = window.location.pathname;
    if (!currentPath.includes("/login") && !currentPath.includes("/auth")) {
      window.location.assign(
        `/login?redirectTo=${encodeURIComponent(currentPath)}`,
      );
    }
  }
  if (status === 402 && code === "quota.recurrent_limit.exceeded") {
    // TODO: wire to upsell store when available
    console.warn("Upsell required: quota.recurrent_limit.exceeded");
  }
};

async function doFetch<T>(
  base: string,
  path: string,
  options: RequestOptions<T>,
): Promise<T> {
  const url = buildUrl(base, path, options.searchParams);
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  // Proteção CSRF para sessão baseada em cookie:
  // envia token fora do cookie em métodos mutáveis.
  const method = options.method ?? "GET";
  if (method !== "GET" && !headers["X-CSRF-Token"]) {
    const csrfToken = useAuthStore.getState().csrfToken;
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  const traceId = response.headers.get("X-Trace-Id") ?? undefined;
  const hasBody = response.status !== 204;
  let payload: unknown;

  if (hasBody) {
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
  }

  if (!response.ok) {
    const errorPayload = parseErrorPayload(payload);
    const code = errorPayload?.error.code;
    handleErrorRedirects(response.status, code);
    throw new ApiError({
      status: response.status,
      message: errorPayload?.error.message ?? "Request failed",
      code,
      traceId: errorPayload?.error.traceId ?? traceId,
      details: errorPayload?.error.details,
    });
  }

  if (!payload) {
    return undefined as T;
  }

  if (!options.schema) {
    return payload as T;
  }

  return options.schema.parse(payload);
}

async function request<T = unknown>(
  path: string,
  options: RequestOptions<T> = {},
): Promise<T> {
  let lastError: unknown;
  for (const base of API_BASES) {
    try {
      return await doFetch(base, path, options);
    } catch (error) {
      const isNetworkError = error instanceof TypeError;
      const isLastCandidate = base === API_BASES[API_BASES.length - 1];

      if (!isNetworkError || SHOULD_FORCE_MOCKS || isLastCandidate) {
        throw error;
      }

      lastError = error;
      console.warn(
        `[babybook] Falha ao contactar ${base}. Tentando fallback local...`,
        error,
      );
    }
  }

  throw lastError ?? new Error("API request failed");
}

export const apiClient = {
  get<T = unknown>(path: string, options?: Omit<RequestOptions<T>, "method">) {
    return request<T>(path, { ...options, method: "GET" });
  },
  post<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions<T>, "method" | "body">,
  ) {
    return request<T>(path, { ...options, method: "POST", body });
  },
  patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions<T>, "method" | "body">,
  ) {
    return request<T>(path, { ...options, method: "PATCH", body });
  },
  delete(path: string, options?: Omit<RequestOptions<undefined>, "method">) {
    return request<undefined>(path, { ...options, method: "DELETE" });
  },
};
