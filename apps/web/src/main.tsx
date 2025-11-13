import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@babybook/i18n";
import { AppRouter } from "./app/router";
import { enableMockServiceWorker } from "./mocks/init";
import "./index.css";

const queryClient = new QueryClient();

const shouldEnableMocks =
  import.meta.env.VITE_ENABLE_MSW === "true" &&
  (import.meta.env.DEV || import.meta.env.MODE === "test");

async function startApp() {
  if (shouldEnableMocks) {
    await enableMockServiceWorker();
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <AppRouter />
        </QueryClientProvider>
      </I18nProvider>
    </React.StrictMode>,
  );
}

startApp();
