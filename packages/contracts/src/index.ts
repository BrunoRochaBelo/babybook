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
  const rawMedia = payload.media;
  const media = Array.isArray(rawMedia)
    ? rawMedia
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

export type Moment = z.infer<typeof momentSchema>;

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
  message: z.string(),
  status: z.enum(["approved", "pending", "hidden"]),
  created_at: isoDateSchema,
});

export const guestbookEntrySchema = rawGuestbookEntrySchema.transform(
  (entry) => ({
    id: entry.id,
    childId: entry.child_id,
    authorName: entry.author_name,
    authorEmail: entry.author_email ?? null,
    message: entry.message,
    status: entry.status,
    createdAt: entry.created_at,
  }),
);

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

const rawHealthVisitSchema = z.object({
  id: z.string().uuid(),
  child_id: z.string().uuid(),
  date: isoDateSchema,
  reason: z.string(),
  notes: z.string().nullable().optional(),
  created_at: isoDateSchema,
});

export const healthVisitSchema = rawHealthVisitSchema.transform((visit) => ({
  id: visit.id,
  childId: visit.child_id,
  date: visit.date,
  reason: visit.reason,
  notes: visit.notes ?? null,
  createdAt: visit.created_at,
}));

export type HealthVisit = z.infer<typeof healthVisitSchema>;

export const paginatedHealthVisitsSchema = paginatedResponse(
  rawHealthVisitSchema,
).transform(({ items, next }) => ({
  items: items.map((visit) => healthVisitSchema.parse(visit)),
  next,
}));

export type PaginatedHealthVisits = z.infer<typeof paginatedHealthVisitsSchema>;

const rawVaccineSchema = z.object({
  id: z.string().uuid(),
  child_id: z.string().uuid(),
  name: z.string(),
  due_date: isoDateSchema,
  applied_at: isoDateSchema.nullable(),
  status: z.enum(["scheduled", "completed", "overdue"]),
  notes: z.string().nullable().optional(),
});

export const healthVaccineSchema = rawVaccineSchema.transform((vaccine) => ({
  id: vaccine.id,
  childId: vaccine.child_id,
  name: vaccine.name,
  dueDate: vaccine.due_date,
  appliedAt: vaccine.applied_at,
  status: vaccine.status,
  notes: vaccine.notes ?? null,
}));

export type HealthVaccine = z.infer<typeof healthVaccineSchema>;

export const paginatedHealthVaccinesSchema = paginatedResponse(
  rawVaccineSchema,
).transform(({ items, next }) => ({
  items: items.map((item) => healthVaccineSchema.parse(item)),
  next,
}));

export type PaginatedHealthVaccines = z.infer<
  typeof paginatedHealthVaccinesSchema
>;

const vaultDocumentKindSchema = z.enum([
  "certidao",
  "cpf_rg",
  "sus_plano",
  "outro",
]);
export type VaultDocumentKind = z.infer<typeof vaultDocumentKindSchema>;

const rawVaultDocumentSchema = z.object({
  id: z.string().uuid(),
  child_id: z.string().uuid(),
  kind: vaultDocumentKindSchema,
  asset_id: z.string().uuid(),
  note: z.string().nullable(),
  created_at: isoDateSchema,
});

export const vaultDocumentSchema = rawVaultDocumentSchema.transform((doc) => ({
  id: doc.id,
  childId: doc.child_id,
  kind: doc.kind,
  assetId: doc.asset_id,
  note: doc.note ?? null,
  createdAt: doc.created_at,
}));

export type VaultDocument = z.infer<typeof vaultDocumentSchema>;

export const paginatedVaultDocumentsSchema = paginatedResponse(
  rawVaultDocumentSchema,
).transform(({ items, next }) => ({
  items: items.map((doc) => vaultDocumentSchema.parse(doc)),
  next,
}));

export type PaginatedVaultDocuments = z.infer<
  typeof paginatedVaultDocumentsSchema
>;

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

const userRoleSchema = z.enum([
  "owner",
  "guardian",
  "viewer",
  "photographer",
  "admin",
]);

const rawUserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  locale: z.string().nullable().optional(),
  role: userRoleSchema.optional(),
  has_purchased: z.boolean().optional(),
  onboarding_completed: z.boolean().optional(),
});

export const userProfileSchema = rawUserProfileSchema.transform((profile) => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  locale: profile.locale ?? "pt-BR",
  role: profile.role ?? "owner",
  hasPurchased: profile.has_purchased ?? false,
  onboardingCompleted: profile.onboarding_completed ?? false,
}));

export type UserProfile = z.infer<typeof userProfileSchema>;

// ============================================================
// Direct Partner Deliveries (sem voucher)
// ============================================================

const rawPendingDeliveryItemSchema = z.object({
  delivery_id: z.string().uuid(),
  partner_name: z.string().nullable().optional(),
  title: z.string(),
  target_email: z.string().email().nullable().optional(),
  target_email_masked: z.string().nullable().optional(),
  assets_count: z.number().int().nonnegative().optional(),
  created_at: isoDateSchema,
});

export const pendingDeliveryItemSchema = rawPendingDeliveryItemSchema.transform(
  (d) => ({
    deliveryId: d.delivery_id,
    partnerName: d.partner_name ?? null,
    title: d.title,
    targetEmail: d.target_email ?? null,
    targetEmailMasked: d.target_email_masked ?? null,
    assetsCount: d.assets_count ?? 0,
    createdAt: d.created_at,
  }),
);

export type PendingDeliveryItem = z.infer<typeof pendingDeliveryItemSchema>;

export const pendingDeliveriesSchema = z
  .object({
    items: z.array(rawPendingDeliveryItemSchema),
    total: z.number().int().nonnegative(),
  })
  .transform(({ items, total }) => ({
    items: items.map((it) => pendingDeliveryItemSchema.parse(it)),
    total,
  }));

export type PendingDeliveries = z.infer<typeof pendingDeliveriesSchema>;

const rawDeliveryImportResponseSchema = z.object({
  success: z.boolean().optional(),
  delivery_id: z.string().uuid(),
  assets_transferred: z.number().int().nonnegative().optional(),
  child_id: z.string().uuid(),
  moment_id: z.string().uuid(),
  message: z.string(),
});

export const deliveryImportResponseSchema =
  rawDeliveryImportResponseSchema.transform((r) => ({
    success: r.success ?? true,
    deliveryId: r.delivery_id,
    assetsTransferred: r.assets_transferred ?? 0,
    childId: r.child_id,
    momentId: r.moment_id,
    message: r.message,
  }));

export type DeliveryImportResponse = z.infer<
  typeof deliveryImportResponseSchema
>;

export const assetVariantInputSchema = z.object({
  preset: z.string().max(80),
  key: z.string().max(255),
  size_bytes: z.number().int().nonnegative(),
  width_px: z.number().int().positive().nullable().optional(),
  height_px: z.number().int().positive().nullable().optional(),
  kind: z.enum(["photo", "video", "audio"]),
});

export type AssetVariantInput = z.infer<typeof assetVariantInputSchema>;

export const assetStatusUpdateSchema = z.object({
  status: z.enum(["queued", "processing", "ready", "failed"]).optional(),
  duration_ms: z.number().int().nonnegative().nullable().optional(),
  error_code: z.string().max(120).nullable().optional(),
  viewer_accessible: z.boolean().optional(),
  key_original: z.string().max(255).nullable().optional(),
  variants: z.array(assetVariantInputSchema).optional(),
});

export type AssetStatusUpdate = z.infer<typeof assetStatusUpdateSchema>;

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
