import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  Child,
  childSchema,
  GuestbookEntry,
  guestbookEntrySchema,
  healthMeasurementSchema,
  HealthMeasurement,
  momentSchema,
  Moment,
  paginatedChildrenSchema,
  paginatedGuestbookSchema,
  paginatedMomentsSchema,
  QuotaUsage,
  quotaUsageSchema,
  UserProfile,
  userProfileSchema,
} from "@babybook/contracts";
import { apiClient, ApiError } from "@/lib/api-client";

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

export const useChildren = () =>
  useQuery({
    queryKey: ["children"],
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
        return await apiClient.get(
          `/children/${childId}/health/measurements`,
          {
            schema: z.array(healthMeasurementSchema),
          },
        );
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
        return await apiClient.post(
          "/health/measurements",
          measurement,
          { schema: healthMeasurementSchema },
        );
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

export const useUserProfile = () =>
  useQuery({
    queryKey: ["user-profile"],
    queryFn: async (): Promise<UserProfile> =>
      apiClient.get("/me", { schema: userProfileSchema }),
  });

export const useStorageQuota = () =>
  useQuery({
    queryKey: ["storage-quota"],
    queryFn: async (): Promise<QuotaUsage> =>
      apiClient.get("/me/usage", { schema: quotaUsageSchema }),
  });
