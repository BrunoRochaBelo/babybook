import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { enableMockServiceWorker } from "./mocks/init";
import { AppRouter } from "./router";
import "./index.css";

function applyInitialTheme() {
  try {
    const key = "babybook-theme";
    const stored = localStorage.getItem(key);
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

const isDev = import.meta.env.DEV;

function shouldRetryError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    if (status >= 400 && status < 500) return false;
    if (status >= 500) return true;
  }
  return isDev;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount: number, error: unknown) => {
        const maxRetries = isDev ? 3 : 2;
        if (failureCount >= maxRetries) return false;
        return shouldRetryError(error);
      },
    },
  },
});

function Bootstrap() {
  // Mantemos o hook apenas para consistência futura (ex.: telemetry);
  // o MSW é inicializado antes do render em startApp().
  useEffect(() => {}, []);
  return <AppRouter />;
}

async function startApp() {
  const enableMocksFlag = (
    import.meta.env.VITE_ENABLE_MSW ??
    (import.meta.env.DEV || import.meta.env.MODE === "test" ? "true" : "false")
  )
    .toString()
    .toLowerCase();

  const shouldEnableMocks =
    enableMocksFlag !== "false" &&
    (import.meta.env.DEV || import.meta.env.MODE === "test");

  if (shouldEnableMocks) {
    // Importante: aguardar o start do worker evita race (login antes do MSW pronto)
    await enableMockServiceWorker();
  } else if (import.meta.env.DEV) {
    console.info(
      "[babybook/affiliates] MSW desativado. Use VITE_ENABLE_MSW=true para dados simulados.",
    );
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <Bootstrap />
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
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

startApp();
