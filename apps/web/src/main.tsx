import React, { PropsWithChildren, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@babybook/i18n";
import { AppRouter } from "./app/router";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { enableMockServiceWorker } from "./mocks/init";
import { useUserProfile } from "./hooks/api";
import { useAuthStore } from "./store/auth";
import {
  mockChildren,
  mockGuestbookEntries,
  mockHealthMeasurements,
  mockHealthVaccines,
  mockMoments,
} from "./mocks/data";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { Toaster } from "sonner";
import "./index.css";
import { getThemeStorageKeyForPath } from "./lib/themeStorageKey";

// Aplica tema o mais cedo possível (sem inline <script> no index.html).
// Mantém o comportamento de escolher entre light/dark/system com base em localStorage.
function applyInitialTheme() {
  try {
    const themeKey = getThemeStorageKeyForPath(window.location.pathname);
    const stored = localStorage.getItem(themeKey);
    const theme =
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "system";

    let effectiveTheme = theme;
    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    if (effectiveTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch {
    // best-effort
  }
}

applyInitialTheme();

// ============================================================
// Configuração Profissional de Retry
// ============================================================
// Padrões seguidos:
// - AWS Well-Architected Framework
// - Google Cloud Error Handling Guidelines
// - Netflix Hystrix / Resilience4j patterns
// ============================================================

const isDev = import.meta.env.DEV;

/**
 * Determina se um erro é transitório e pode ser retentado.
 *
 * SEGURANÇA: Nunca retentamos erros de autenticação/autorização,
 * pois isso poderia:
 * - Mascarar problemas de segurança
 * - Causar lockout de conta
 * - Gerar logs suspeitos no backend
 */
function shouldRetryError(error: unknown): boolean {
  // Erros de rede (TypeError no fetch) - SIM, retentar
  if (error instanceof TypeError) {
    return true;
  }

  // Verifica status HTTP se disponível
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;

    // 4xx - Erros do cliente: NÃO retentar
    // Inclui: 400 Bad Request, 401 Unauthorized, 403 Forbidden,
    //         404 Not Found, 409 Conflict, 422 Validation Error
    if (status >= 400 && status < 500) {
      return false;
    }

    // 5xx - Erros do servidor: SIM, retentar
    // Inclui: 500 Internal Error, 502 Bad Gateway, 503 Service Unavailable
    if (status >= 500) {
      return true;
    }

    // 0 - Falha de conexão: SIM, retentar
    if (status === 0) {
      return true;
    }
  }

  // Em desenvolvimento, retentamos por padrão (HMR, MSW)
  // Em produção, não retentamos erros desconhecidos
  return isDev;
}

/**
 * Calcula delay com backoff exponencial + jitter.
 * Jitter evita "thundering herd" quando múltiplos clientes retentam simultaneamente.
 */
function calculateRetryDelay(attemptIndex: number): number {
  const baseDelay = isDev ? 150 : 100;
  const maxDelay = 5000;

  // Backoff exponencial: 150ms, 300ms, 600ms, 1200ms...
  const exponentialDelay = baseDelay * Math.pow(2, attemptIndex);

  // Adiciona jitter de ±25% para evitar sincronização
  const jitter = 0.75 + Math.random() * 0.5; // 0.75 a 1.25

  return Math.min(exponentialDelay * jitter, maxDelay);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,

      // Retry seletivo baseado no tipo de erro
      retry: (failureCount, error) => {
        const maxRetries = isDev ? 5 : 3;
        if (failureCount >= maxRetries) return false;
        return shouldRetryError(error);
      },

      retryDelay: calculateRetryDelay,
    },

    mutations: {
      // Mutations: mais conservador
      retry: (failureCount, error) => {
        const maxRetries = isDev ? 3 : 2;
        if (failureCount >= maxRetries) return false;
        return shouldRetryError(error);
      },

      retryDelay: calculateRetryDelay,
    },
  },
});

const enableMocksFlag = (
  import.meta.env.VITE_ENABLE_MSW ??
  (import.meta.env.DEV || import.meta.env.MODE === "test" ? "true" : "false")
)
  .toString()
  .toLowerCase();

const shouldEnableMocks =
  enableMocksFlag !== "false" &&
  (import.meta.env.DEV || import.meta.env.MODE === "test");

const AuthBootstrapper = ({ children }: PropsWithChildren) => {
  const { data, isLoading, isError } = useUserProfile();
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (data) {
      login(data);
    }
  }, [data, login]);

  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError, logout]);

  return <>{children}</>;
};

async function startApp() {
  if (shouldEnableMocks) {
    seedMockQueryData(queryClient);
    await enableMockServiceWorker();
  } else if (import.meta.env.DEV) {
    console.info(
      "[babybook] Mock Service Worker está desativado. Defina VITE_ENABLE_MSW=true para trabalhar com os dados simulados.",
    );
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <I18nProvider>
          <QueryClientProvider client={queryClient}>
            <NotificationsProvider>
              <AuthBootstrapper>
                <AppRouter />
              </AuthBootstrapper>
            </NotificationsProvider>
          </QueryClientProvider>
        </I18nProvider>
      </ErrorBoundary>
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: "font-sans",
          },
        }}
      />
    </React.StrictMode>,
  );
}

startApp();

function seedMockQueryData(client: QueryClient) {
  client.setQueryData(["children"], mockChildren);

  mockChildren.forEach((child) => {
    client.setQueryData(
      ["moments", child.id],
      mockMoments.filter((moment) => moment.childId === child.id),
    );
    client.setQueryData(
      ["guestbook", child.id],
      mockGuestbookEntries.filter((entry) => entry.childId === child.id),
    );
    client.setQueryData(
      ["health-measurements", child.id],
      mockHealthMeasurements.filter(
        (measurement) => measurement.childId === child.id,
      ),
    );
    client.setQueryData(["health-visits", child.id], []);
    client.setQueryData(
      ["health-vaccines", child.id],
      mockHealthVaccines.filter((vaccine) => vaccine.childId === child.id),
    );
    client.setQueryData(["vault-documents", child.id], []);
  });
}
