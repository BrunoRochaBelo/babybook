import React, { PropsWithChildren, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@babybook/i18n";
import { AppRouter } from "./app/router";
import { enableMockServiceWorker } from "./mocks/init";
import { useUserProfile } from "./hooks/api";
import { useAuthStore } from "./store/auth";
import {
  mockChildren,
  mockGuestbookEntries,
  mockHealthMeasurements,
  mockHealthVaccines,
  mockMoments,
  mockUser,
} from "./mocks/data";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
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
  const { data, isLoading, isError } = useUserProfile({
    enabled: !shouldEnableMocks,
  });
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
    if (!shouldEnableMocks && isError) {
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
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <AuthBootstrapper>
            <AppRouter />
          </AuthBootstrapper>
        </QueryClientProvider>
      </I18nProvider>
    </React.StrictMode>,
  );
}

startApp();

function seedMockQueryData(client: QueryClient) {
  client.setQueryData(["children"], mockChildren);
  client.setQueryData(["user-profile"], mockUser);
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
