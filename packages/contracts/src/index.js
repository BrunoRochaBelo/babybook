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
const paginatedResponse = (schema) =>
  z.object({
    items: z.array(schema),
    next: z.string().nullable(),
  });
export const paginatedChildrenSchema = paginatedResponse(
  rawChildSchema,
).transform(({ items, next }) => ({
  items: items.map((child) => childSchema.parse(child)),
  next,
}));
const rawMomentMediaSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "video", "audio"]),
  url: z.string().url().optional(),
  key: z.string().optional(),
  durationSeconds: z.number().int().optional(),
  variants: z
    .array(
      z.object({
        preset: z.string(),
        key: z.string().optional(),
        url: z.string().url().optional(),
        size_bytes: z.number().int().nonnegative().optional(),
        width_px: z.number().int().positive().nullable().optional(),
        height_px: z.number().int().positive().nullable().optional(),
        kind: z.enum(["photo", "video", "audio"]).optional(),
      }),
    )
    .optional(),
});
export const momentMediaSchema = rawMomentMediaSchema.transform((media) => ({
  id: media.id,
  kind: media.type === "image" ? "photo" : media.type,
  url: media.url ?? null,
  key: media.key ?? null,
  durationSeconds: media.durationSeconds,
  variants: media.variants?.map((variant) => ({
    preset: variant.preset,
    key: variant.key ?? null,
    url: variant.url ?? null,
    sizeBytes: variant.size_bytes ?? null,
    widthPx: variant.width_px ?? null,
    heightPx: variant.height_px ?? null,
    kind: variant.kind ?? (media.type === "image" ? "photo" : media.type),
  })),
}));
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
  const media = Array.isArray(payload.media)
    ? payload.media
        .map((entry) => momentMediaSchema.safeParse(entry))
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
export const paginatedMomentsSchema = paginatedResponse(
  rawMomentSchema,
).transform(({ items, next }) => ({
  items: items.map((moment) => momentSchema.parse(moment)),
  next,
}));
const rawGuestbookEntrySchema = z.object({
  id: z.string().uuid(),
  child_id: z.string().uuid(),
  author_name: z.string(),
  author_email: z.string().email().nullable(),
  relationship_degree: z.enum([
    "mae",
    "pai",
    "tio",
    "tia",
    "irmao_irma",
    "avo",
    "avoa",
    "amigo",
    "madrasta",
    "padrasto",
  ]),
  message: z.string(),
  status: z.enum(["approved", "pending", "hidden"]),
  created_at: isoDateSchema,
  asset_id: z.string().uuid().nullable().optional(),
});
export const guestbookEntrySchema = rawGuestbookEntrySchema.transform(
  (entry) => ({
    id: entry.id,
    childId: entry.child_id,
    authorName: entry.author_name,
    authorEmail: entry.author_email ?? null,
    relationshipDegree: entry.relationship_degree,
    message: entry.message,
    status: entry.status,
    createdAt: entry.created_at,
    assetId: entry.asset_id ?? null,
  }),
);
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
const userRoleSchema = z.enum(["owner", "guardian", "viewer"]);
const rawUserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  locale: z.string().nullable().optional(),
  role: userRoleSchema.optional(),
});
export const userProfileSchema = rawUserProfileSchema.transform((profile) => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  locale: profile.locale ?? "pt-BR",
  role: profile.role ?? "owner",
}));
export const assetVariantInputSchema = z.object({
  preset: z.string().max(80),
  key: z.string().max(255),
  size_bytes: z.number().int().nonnegative(),
  width_px: z.number().int().positive().nullable().optional(),
  height_px: z.number().int().positive().nullable().optional(),
  kind: z.enum(["photo", "video", "audio"]),
});
export const assetStatusUpdateSchema = z.object({
  status: z.enum(["queued", "processing", "ready", "failed"]).optional(),
  duration_ms: z.number().int().nonnegative().nullable().optional(),
  error_code: z.string().max(120).nullable().optional(),
  viewer_accessible: z.boolean().optional(),
  key_original: z.string().max(255).nullable().optional(),
  variants: z.array(assetVariantInputSchema).optional(),
});
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
