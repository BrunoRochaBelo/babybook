import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  Child,
  childSchema,
  DeliveryImportResponse,
  deliveryImportResponseSchema,
  GuestbookEntry,
  guestbookEntrySchema,
  healthMeasurementSchema,
  HealthMeasurement,
  healthVisitSchema,
  HealthVisit,
  HealthVaccine,
  momentSchema,
  Moment,
  paginatedChildrenSchema,
  paginatedGuestbookSchema,
  paginatedHealthVisitsSchema,
  paginatedHealthVaccinesSchema,
  paginatedMomentsSchema,
  paginatedVaultDocumentsSchema,
  PendingDeliveries,
  pendingDeliveriesSchema,
  QuotaUsage,
  quotaUsageSchema,
  UserProfile,
  userProfileSchema,
  vaultDocumentSchema,
  VaultDocument,
  VaultDocumentKind,
} from "@babybook/contracts";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth";
import { withRetry } from "@/lib/retry";

/**
 * Obtém um token CSRF do servidor com retry automático.
 *
 * Usa backoff exponencial para lidar com:
 * - HMR em desenvolvimento (MSW pode não estar pronto)
 * - Problemas temporários de rede
 * - Servidor momentaneamente indisponível
 *
 * @returns Token CSRF válido
 * @throws Error se todas as tentativas falharem
 */
async function fetchCsrfToken(): Promise<string> {
  const isDev = import.meta.env.DEV;

  try {
    const csrf = await withRetry(
      async () => {
        const response = await apiClient.get<{ csrf_token: string }>(
          "/auth/csrf",
        );

        // Valida a resposta
        if (!response || typeof response.csrf_token !== "string") {
          throw new Error("Resposta inválida do servidor de autenticação");
        }

        return response.csrf_token;
      },
      {
        maxAttempts: isDev ? 5 : 3, // Mais tentativas em dev (HMR)
        baseDelayMs: isDev ? 150 : 100,
        onRetry: (error, attempt, delayMs) => {
          if (isDev) {
            console.warn(
              `[babybook] Tentativa ${attempt} de obter CSRF token falhou. ` +
                `Tentando novamente em ${delayMs}ms...`,
              error,
            );
          }
        },
      },
    );

    return csrf;
  } catch {
    // Mensagem amigável para o usuário
    throw new Error(
      "Não foi possível conectar ao servidor de autenticação. " +
        "Verifique sua conexão e tente novamente.",
    );
  }
}

type CreateChildInput = {
  name: string;
  birthday?: string | null;
  avatarUrl?: string | null;
};

type CreateMomentInput = {
  childId: string;
  title: string;
  summary?: string;
  occurredAt?: string;
  templateKey?: string;
  privacy?: "private" | "people" | "public";
  payload?: Record<string, unknown>;
};

type CreateGuestbookEntryInput = {
  childId: string;
  authorName: string;
  authorEmail?: string;
  message: string;
};

type CreateHealthMeasurementInput = Omit<HealthMeasurement, "id">;

type CreateHealthVisitInput = {
  childId: string;
  date: string;
  reason: string;
  notes?: string | null;
};

type CreateVaultDocumentInput = {
  childId: string;
  kind: VaultDocumentKind;
  assetId: string;
  note?: string | null;
};

export const useChildren = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ["children"],
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<Child[]> => {
      const response = await apiClient.get("/children", {
        schema: paginatedChildrenSchema,
      });
      return response.items;
    },
  });

export const useCreateChild = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateChildInput): Promise<Child> => {
      return apiClient.post(
        "/children",
        {
          name: payload.name,
          birthday: payload.birthday,
          avatar_url: payload.avatarUrl,
        },
        { schema: childSchema },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
};

export const usePendingDirectDeliveries = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ["pending-direct-deliveries"],
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<PendingDeliveries> => {
      return apiClient.get("/me/deliveries/pending", {
        schema: pendingDeliveriesSchema,
      });
    },
  });

export const useImportDirectDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      deliveryId: string;
      action:
        | { type: "EXISTING_CHILD"; childId: string }
        | { type: "NEW_CHILD"; childName?: string };
    }): Promise<DeliveryImportResponse> => {
      const idempotency_key = nanoid();
      if (payload.action.type === "EXISTING_CHILD") {
        return apiClient.post(
          `/me/deliveries/${payload.deliveryId}/import`,
          {
            idempotency_key,
            action: {
              type: "EXISTING_CHILD",
              child_id: payload.action.childId,
            },
          },
          { schema: deliveryImportResponseSchema },
        );
      }
      return apiClient.post(
        `/me/deliveries/${payload.deliveryId}/import`,
        {
          idempotency_key,
          action: {
            type: "NEW_CHILD",
            child_name: payload.action.childName,
          },
        },
        { schema: deliveryImportResponseSchema },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-direct-deliveries"],
      });
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
};

export const useMoments = (childId?: string) =>
  useQuery({
    queryKey: ["moments", childId],
    enabled: Boolean(childId),
    queryFn: async (): Promise<Moment[]> => {
      if (!childId) {
        return [];
      }
      const response = await apiClient.get("/moments", {
        schema: paginatedMomentsSchema,
        searchParams: { child_id: childId },
      });
      return response.items;
    },
  });

export const useMoment = (momentId?: string) =>
  useQuery({
    queryKey: ["moment", momentId],
    enabled: Boolean(momentId),
    queryFn: async (): Promise<Moment | undefined> => {
      if (!momentId) {
        return undefined;
      }
      return apiClient.get(`/moments/${momentId}`, { schema: momentSchema });
    },
  });

export const useCreateMoment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMomentInput): Promise<Moment> => {
      return apiClient.post(
        "/moments",
        {
          child_id: payload.childId,
          title: payload.title,
          summary: payload.summary,
          occurred_at: payload.occurredAt,
          template_key: payload.templateKey,
          privacy: payload.privacy,
          payload: payload.payload,
        },
        { schema: momentSchema },
      );
    },
    onSuccess: (moment) => {
      queryClient.invalidateQueries({
        queryKey: ["moments", moment.childId],
      });
    },
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      password: string;
      rememberMe?: boolean;
    }) => {
      // Obtém token CSRF com retry automático
      const csrfToken = await fetchCsrfToken();

      // Persistimos o token que ficará pareado com a sessão criada.
      useAuthStore.getState().setCsrfToken(csrfToken);

      await apiClient.post("/auth/login", {
        email: payload.email,
        password: payload.password,
        csrf_token: csrfToken,
        remember_me: payload.rememberMe ?? false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      password: string;
      name?: string;
    }) => {
      const csrfToken = await fetchCsrfToken();

      useAuthStore.getState().setCsrfToken(csrfToken);

      await apiClient.post("/auth/register", {
        email: payload.email,
        password: payload.password,
        csrf_token: csrfToken,
        name: payload.name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post("/auth/logout");
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 405)
        ) {
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["user-profile"] });
    },
  });
};

export const useCreateCheckout = () => {
  return useMutation({
    mutationFn: async (payload: { packageKey: string }) => {
      return apiClient.post("/webhooks/checkout", {
        package_key: payload.packageKey,
      });
    },
  });
};

export const useMockComplete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { accountId: string; packageKey: string }) => {
      return apiClient.post("/webhooks/mock-complete", {
        account_id: payload.accountId,
        package_key: payload.packageKey,
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["user-profile"] }),
  });
};

export const useForgotPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string }) => {
      try {
        const csrfToken = await fetchCsrfToken();

        return await apiClient.post("/auth/password/forgot", {
          email: payload.email,
          csrf_token: csrfToken,
        });
      } catch (error) {
        // If endpoint doesn't exist (local dev without API), consider as success
        if (
          error instanceof ApiError &&
          (error.status === 404 || error.status === 405)
        ) {
          return { status: "ok", mock: true };
        }
        throw error;
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["user-profile"] }),
  });
};

export const useGuestbookEntries = (childId?: string) =>
  useQuery({
    queryKey: ["guestbook", childId],
    enabled: Boolean(childId),
    queryFn: async (): Promise<GuestbookEntry[]> => {
      if (!childId) {
        return [];
      }
      const response = await apiClient.get("/guestbook", {
        schema: paginatedGuestbookSchema,
        searchParams: { child_id: childId },
      });
      return response.items;
    },
  });

export const useCreateGuestbookEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      entry: CreateGuestbookEntryInput,
    ): Promise<GuestbookEntry> => {
      return apiClient.post(
        "/guestbook",
        {
          child_id: entry.childId,
          author_name: entry.authorName,
          author_email: entry.authorEmail,
          message: entry.message,
        },
        { schema: guestbookEntrySchema },
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["guestbook", variables.childId],
      });
    },
  });
};

export const useHealthMeasurements = (childId?: string) =>
  useQuery({
    queryKey: ["health-measurements", childId],
    enabled: Boolean(childId),
    queryFn: async (): Promise<HealthMeasurement[]> => {
      if (!childId) {
        return [];
      }
      try {
        return await apiClient.get(`/children/${childId}/health/measurements`, {
          schema: z.array(healthMeasurementSchema),
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return [];
        }
        throw error;
      }
    },
  });

export const useCreateHealthMeasurement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      measurement: CreateHealthMeasurementInput,
    ): Promise<HealthMeasurement> => {
      try {
        return await apiClient.post("/health/measurements", measurement, {
          schema: healthMeasurementSchema,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return {
            ...measurement,
            id: nanoid(),
          };
        }
        throw error;
      }
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: ["health-measurements", created.childId],
      });
    },
  });
};

export const useHealthVisits = (childId?: string) =>
  useQuery({
    queryKey: ["health-visits", childId],
    enabled: Boolean(childId),
    queryFn: async (): Promise<HealthVisit[]> => {
      if (!childId) {
        return [];
      }
      try {
        const response = await apiClient.get("/health/visits", {
          schema: paginatedHealthVisitsSchema,
          searchParams: { child_id: childId },
        });
        return response.items;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return [];
        }
        throw error;
      }
    },
  });

export const useCreateHealthVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: CreateHealthVisitInput,
    ): Promise<HealthVisit> => {
      try {
        return await apiClient.post(
          "/health/visits",
          {
            child_id: payload.childId,
            date: payload.date,
            reason: payload.reason,
            notes: payload.notes,
          },
          { schema: healthVisitSchema },
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return {
            id: nanoid(),
            childId: payload.childId,
            date: payload.date,
            reason: payload.reason,
            notes: payload.notes ?? null,
            createdAt: new Date().toISOString(),
          };
        }
        throw error;
      }
    },
    onSuccess: (visit) => {
      queryClient.invalidateQueries({
        queryKey: ["health-visits", visit.childId],
      });
    },
  });
};

export const useHealthVaccines = (childId?: string) =>
  useQuery({
    queryKey: ["health-vaccines", childId],
    enabled: Boolean(childId),
    queryFn: async (): Promise<HealthVaccine[]> => {
      if (!childId) {
        return [];
      }
      try {
        const response = await apiClient.get("/health/vaccines", {
          schema: paginatedHealthVaccinesSchema,
          searchParams: { child_id: childId },
        });
        return response.items;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return [];
        }
        throw error;
      }
    },
  });

export const useVaultDocuments = (childId?: string) =>
  useQuery({
    queryKey: ["vault-documents", childId],
    queryFn: async (): Promise<VaultDocument[]> => {
      try {
        const response = await apiClient.get("/vault/documents", {
          schema: paginatedVaultDocumentsSchema,
          searchParams: childId ? { child_id: childId } : undefined,
        });
        return response.items;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return [];
        }
        throw error;
      }
    },
  });

export const useCreateVaultDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: CreateVaultDocumentInput,
    ): Promise<VaultDocument> => {
      return apiClient.post(
        "/vault/documents",
        {
          child_id: payload.childId,
          kind: payload.kind,
          asset_id: payload.assetId,
          note: payload.note,
        },
        { schema: vaultDocumentSchema },
      );
    },
    onSuccess: (doc) => {
      queryClient.invalidateQueries({
        queryKey: ["vault-documents", doc.childId],
      });
    },
  });
};

export const useUserProfile = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ["user-profile"],
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<UserProfile> =>
      apiClient.get("/me", { schema: userProfileSchema }),
  });

export const useStorageQuota = (options?: {
  enabled?: boolean;
  childId?: string;
}) =>
  useQuery({
    queryKey: ["storage-quota", options?.childId ?? null],
    enabled: (options?.enabled ?? true) && Boolean(options?.childId),
    queryFn: async (): Promise<QuotaUsage> => {
      const childId = options?.childId;
      if (!childId) {
        throw new Error(
          "useStorageQuota requer childId (o backend exige child_id em /me/usage)",
        );
      }

      return apiClient.get("/me/usage", {
        schema: quotaUsageSchema,
        searchParams: { child_id: childId },
      });
    },
  });
