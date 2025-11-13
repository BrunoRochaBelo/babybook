import { z } from "zod";

const isoDateSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid ISO 8601 date",
  });

const rawChildSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  birthday: isoDateSchema.nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  created_at: isoDateSchema,
  updated_at: isoDateSchema,
});

export const childSchema = rawChildSchema.transform((child) => ({
  id: child.id,
  name: child.name,
  birthday: child.birthday ?? null,
  avatarUrl: child.avatar_url ?? null,
  createdAt: child.created_at,
  updatedAt: child.updated_at,
}));

export type Child = z.infer<typeof childSchema>;

const paginatedResponse = <Schema extends z.ZodTypeAny>(schema: Schema) =>
  z.object({
    items: z.array(schema),
    next: z.string().nullable(),
  });

export const paginatedChildrenSchema = paginatedResponse(rawChildSchema).transform(
  ({ items, next }) => ({
    items: items.map((child) => childSchema.parse(child)),
    next,
  }),
);

const momentMediaSchema = z.object({
  id: z.string(),
  kind: z.enum(["photo", "video", "audio"]),
  url: z.string().url(),
  durationSeconds: z.number().int().optional(),
});

export type MomentMedia = z.infer<typeof momentMediaSchema>;

const rawMomentSchema = z.object({
  id: z.string().uuid(),
  child_id: z.string().uuid(),
  template_key: z.string().nullable(),
  title: z.string(),
  summary: z.string().nullable(),
  occurred_at: isoDateSchema.nullable(),
  status: z.enum(["draft", "published", "archived"]),
  privacy: z.enum(["private", "people", "public"]),
  payload: z.record(z.unknown()).nullish(),
  rev: z.number().int(),
  created_at: isoDateSchema,
  updated_at: isoDateSchema,
  published_at: isoDateSchema.nullable(),
});

export const momentSchema = rawMomentSchema.transform((moment) => {
  const payload = moment.payload ?? {};
  const media = Array.isArray((payload as Record<string, unknown>).media)
    ? ((payload as { media?: unknown }).media as unknown[])
        .map((entry) =>
          z
            .object({
              id: z.string(),
              type: z.enum(["image", "video", "audio"]),
              url: z.string().url(),
              durationSeconds: z.number().int().optional(),
            })
            .transform((value) => ({
              id: value.id,
              kind: value.type === "image" ? "photo" : value.type,
              url: value.url,
              durationSeconds: value.durationSeconds,
            }))
            .safeParse(entry),
        )
        .filter((result) => result.success)
        .map((result) => result.data)
    : [];

  return {
    id: moment.id,
    childId: moment.child_id,
    templateKey: moment.template_key,
    title: moment.title,
    summary: moment.summary,
    occurredAt: moment.occurred_at,
    status: moment.status,
    privacy: moment.privacy,
    payload,
    rev: moment.rev,
    createdAt: moment.created_at,
    updatedAt: moment.updated_at,
    publishedAt: moment.published_at,
    media,
  };
});

export type Moment = z.infer<typeof momentSchema>;

export const paginatedMomentsSchema = paginatedResponse(rawMomentSchema).transform(
  ({ items, next }) => ({
    items: items.map((moment) => momentSchema.parse(moment)),
    next,
  }),
);

const rawGuestbookEntrySchema = z.object({
  id: z.string().uuid(),
  child_id: z.string().uuid(),
  author_name: z.string(),
  author_email: z.string().email().nullable(),
  message: z.string(),
  status: z.enum(["approved", "pending", "hidden"]),
  created_at: isoDateSchema,
});

export const guestbookEntrySchema = rawGuestbookEntrySchema.transform((entry) => ({
  id: entry.id,
  childId: entry.child_id,
  authorName: entry.author_name,
  authorEmail: entry.author_email ?? null,
  message: entry.message,
  status: entry.status,
  createdAt: entry.created_at,
}));

export type GuestbookEntry = z.infer<typeof guestbookEntrySchema>;

export const paginatedGuestbookSchema = paginatedResponse(
  rawGuestbookEntrySchema,
).transform(({ items, next }) => ({
  items: items.map((entry) => guestbookEntrySchema.parse(entry)),
  next,
}));

export const healthMeasurementSchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  date: isoDateSchema,
  weight: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
});

export type HealthMeasurement = z.infer<typeof healthMeasurementSchema>;

const rawUsageSchema = z.object({
  bytes_used: z.number().nonnegative(),
  bytes_quota: z.number().nonnegative(),
  moments_used: z.number().int().nonnegative(),
  moments_quota: z.number().int().nonnegative(),
});

export const quotaUsageSchema = rawUsageSchema.transform((usage) => ({
  bytesUsed: usage.bytes_used,
  bytesQuota: usage.bytes_quota,
  momentsUsed: usage.moments_used,
  momentsQuota: usage.moments_quota,
}));

export type QuotaUsage = z.infer<typeof quotaUsageSchema>;

const rawUserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  locale: z.string().nullable().optional(),
});

export const userProfileSchema = rawUserProfileSchema.transform((profile) => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  locale: profile.locale ?? "pt-BR",
}));

export type UserProfile = z.infer<typeof userProfileSchema>;

export const apiErrorSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
      trace_id: z.string(),
    }),
  })
  .transform(({ error }) => ({
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      traceId: error.trace_id,
    },
  }));

export type ApiErrorPayload = z.infer<typeof apiErrorSchema>;

export type PaginatedResponse<T> = {
  items: T[];
  next: string | null;
};
