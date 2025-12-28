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

const rawAllowHeaderSession = (
  import.meta.env.VITE_ALLOW_HEADER_SESSION_AUTH ??
  (import.meta.env.DEV || import.meta.env.MODE === "test" ? "true" : "false")
)
  .toString()
  .toLowerCase();

const rawAllowHeaderSessionAck = (
  import.meta.env.VITE_ALLOW_HEADER_SESSION_AUTH_ACK ?? "false"
)
  .toString()
  .toLowerCase();

const ALLOW_HEADER_SESSION_AUTH_ACK = rawAllowHeaderSessionAck === "true";

// Guardrail: em build PROD, só permitimos ligar o fallback via header com ACK explícito.
// Em dev/test, continua permitido (útil para E2E/local quando cookies falham).
const ALLOW_HEADER_SESSION_AUTH =
  rawAllowHeaderSession === "true" &&
  (import.meta.env.DEV ||
    import.meta.env.MODE === "test" ||
    ALLOW_HEADER_SESSION_AUTH_ACK);

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

const getPersistedSessionToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem("babybook-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: { sessionToken?: unknown };
    };
    const token = parsed?.state?.sessionToken;
    return typeof token === "string" && token ? token : null;
  } catch {
    return null;
  }
};

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

const handleErrorRedirects = (
  status: number,
  code?: string,
  requestPath?: string,
) => {
  if (status === 401) {
    const currentPath = window.location.pathname;

    // O bootstrap do app (useUserProfile -> /me) roda em praticamente todas as telas.
    // Quando não há sessão, 401 aqui é esperado e NÃO deve disparar redirect imperativo,
    // senão criamos loops com `RequireAuth`/`LoginPage` (ex.: /checkout <-> /login).
    if (requestPath?.startsWith("/me")) {
      return;
    }

    // Rotas públicas onde 401 é esperado (ex.: bootstrap do perfil) e NÃO deve
    // forçar redirecionamento para /login.
    const isPublicAuthPage = [
      "/login",
      "/register",
      "/forgot-password",
      "/pro/login",
      "/pro/register",
    ].some(
      (path) => currentPath === path || currentPath.startsWith(`${path}/`),
    );

    if (
      !isPublicAuthPage &&
      !currentPath.includes("/login") &&
      !currentPath.includes("/auth")
    ) {
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

  // Fallback de autenticação (dev/E2E): alguns navegadores podem não enviar
  // cookies em fetch cross-origin (mesmo host, porta diferente). O backend
  // pode aceitar `X-BB-Session` como alternativa ao cookie HttpOnly.
  // Por segurança, isso fica DESLIGADO por padrão em produção.
  if (ALLOW_HEADER_SESSION_AUTH && !headers["X-BB-Session"]) {
    let sessionToken = useAuthStore.getState().sessionToken;
    if (!sessionToken) {
      sessionToken = getPersistedSessionToken();
      if (sessionToken) {
        // Deixa o store consistente para as próximas requisições.
        useAuthStore.getState().setSessionToken(sessionToken);
      }
    }
    if (sessionToken) {
      headers["X-BB-Session"] = sessionToken;
    }
  }

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

  // Dev/E2E helper: backend pode retornar o token de sessão em header para
  // permitir persistência em localStorage quando cookies não são enviados.
  if (ALLOW_HEADER_SESSION_AUTH) {
    const sessionHeader = response.headers.get("X-BB-Session") ?? undefined;
    if (sessionHeader) {
      useAuthStore.getState().setSessionToken(sessionHeader);
    }
  }

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
    handleErrorRedirects(response.status, code, path);
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
