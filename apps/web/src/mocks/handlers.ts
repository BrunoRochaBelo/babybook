import { http, HttpResponse } from "msw";
import { nanoid } from "nanoid";
import {
  mockChildren,
  mockGuestbookEntries,
  mockHealthMeasurements,
  mockHealthVaccines,
  mockMoments,
  mockUser,
  mockPartnerUser,
  mockPartner,
  mockDeliveries,
  MockDelivery,
} from "./data";
import {
  Child,
  GuestbookEntry,
  HealthMeasurement,
  HealthVaccine,
  Moment,
} from "@babybook/contracts";

type RawProfile = {
  id: string;
  email: string;
  name: string;
  locale: string;
  role: string;
  has_purchased: boolean;
  onboarding_completed: boolean;
};

type MockAccount = RawProfile & { password: string };

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const defaultLocale = mockUser.locale ?? "pt-BR";
const defaultRole = mockUser.role ?? "owner";
const defaultHasPurchased = mockUser.hasPurchased ?? false;
const defaultOnboardingCompleted = mockUser.onboardingCompleted ?? true;

const randomId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return nanoid();
};

const makeAccount = ({
  email,
  password,
  name,
  role = defaultRole,
}: {
  email: string;
  password: string;
  name?: string | null;
  role?: string;
}): MockAccount => ({
  id: randomId(),
  email,
  name: name?.trim() && name.length > 0 ? name.trim() : email.split("@")[0],
  locale: defaultLocale,
  role,
  has_purchased: defaultHasPurchased,
  onboarding_completed: defaultOnboardingCompleted,
  password,
});

const devEmail = normalizeEmail(
  (import.meta.env.VITE_DEV_USER_EMAIL ?? mockUser.email).toString(),
);
const devPassword = (
  import.meta.env.VITE_DEV_USER_PASSWORD ?? "password"
).toString();

// Partner credentials (same as backend seed)
const proEmail = normalizeEmail(
  (import.meta.env.VITE_PRO_USER_EMAIL ?? "pro@babybook.dev").toString(),
);
const proPassword = (
  import.meta.env.VITE_PRO_USER_PASSWORD ?? "pro123"
).toString();

const registeredUsers = new Map<string, MockAccount>();

// Seed regular dev user
const seededAccount = makeAccount({
  email: devEmail,
  password: devPassword,
  name: mockUser.name,
});
registeredUsers.set(devEmail, seededAccount);

// Seed partner/photographer user
const partnerAccount = makeAccount({
  email: proEmail,
  password: proPassword,
  name: mockPartnerUser.name,
  role: "photographer",
});
registeredUsers.set(proEmail, partnerAccount);

const STORAGE_KEY = "@babybook/mock-user-email";

const getInitialUser = () => {
  const storedEmail = localStorage.getItem(STORAGE_KEY);
  if (storedEmail && registeredUsers.has(storedEmail)) {
    return registeredUsers.get(storedEmail)!;
  }
  return seededAccount;
};

let activeUser: MockAccount = getInitialUser();
let sessionActive = true;

const profilePayload = (): RawProfile => ({
  id: activeUser.id,
  email: activeUser.email,
  name: activeUser.name,
  locale: activeUser.locale,
  role: activeUser.role,
  has_purchased: activeUser.has_purchased,
  onboarding_completed: activeUser.onboarding_completed,
});

const enableMocksFlag = (
  import.meta.env.VITE_ENABLE_MSW ??
  (import.meta.env.DEV || import.meta.env.MODE === "test" ? "true" : "false")
)
  .toString()
  .toLowerCase();

const shouldForceLocal = enableMocksFlag !== "false";

const resolveBaseUrl = () => {
  if (shouldForceLocal) {
    return "/api";
  }
  const raw = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
  if (raw.length === 0) {
    return "/api";
  }
  const normalized = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  return normalized || "/api";
};

const baseURL = resolveBaseUrl();
const withBase = (path: string) =>
  baseURL.startsWith("http") ? `${baseURL}${path}` : `${baseURL}${path}`;

const toChildResponse = (child: Child) => ({
  id: child.id,
  name: child.name,
  birthday: child.birthday,
  avatar_url: child.avatarUrl,
  created_at: child.createdAt,
  updated_at: child.updatedAt,
});

const toMomentResponse = (moment: Moment) => ({
  id: moment.id,
  child_id: moment.childId,
  template_key: moment.templateKey,
  title: moment.title,
  summary: moment.summary,
  occurred_at: moment.occurredAt,
  status: moment.status,
  privacy: moment.privacy,
  payload: {
    ...moment.payload,
    media: moment.media.map((media) => ({
      id: media.id,
      type: media.kind === "photo" ? "image" : media.kind,
      url: media.url ?? undefined,
      key: media.key ?? undefined,
      durationSeconds: media.durationSeconds,
      variants: media.variants?.map((variant) => ({
        preset: variant.preset,
        url: variant.url ?? undefined,
        key: variant.key ?? undefined,
        width_px: variant.widthPx ?? undefined,
        height_px: variant.heightPx ?? undefined,
        kind: variant.kind ?? media.kind,
        size_bytes: variant.sizeBytes ?? undefined,
      })),
    })),
  },
  rev: moment.rev,
  created_at: moment.createdAt,
  updated_at: moment.updatedAt,
  published_at: moment.publishedAt,
});

const toGuestbookResponse = (entry: GuestbookEntry) => ({
  id: entry.id,
  child_id: entry.childId,
  author_name: entry.authorName,
  author_email: entry.authorEmail,
  message: entry.message,
  status: entry.status,
  created_at: entry.createdAt,
});

const toHealthResponse = (measurement: HealthMeasurement) => ({
  id: measurement.id,
  childId: measurement.childId,
  date: measurement.date,
  weight: measurement.weight,
  height: measurement.height,
});

const toVaccineResponse = (vaccine: HealthVaccine) => ({
  id: vaccine.id,
  child_id: vaccine.childId,
  name: vaccine.name,
  due_date: vaccine.dueDate,
  applied_at: vaccine.appliedAt,
  status: vaccine.status,
  notes: vaccine.notes,
});

const mutableChildren = [...mockChildren];
const mutableMoments = [...mockMoments];
const mutableGuestbook = [...mockGuestbookEntries];
const mutableMeasurements = [...mockHealthMeasurements];
const mutableVaccines = [...mockHealthVaccines];
const mutableDeliveries: MockDelivery[] = [...mockDeliveries];

type MockClientChildAccess = {
  id: string;
  name: string;
  hasAccess: boolean;
};

type MockClientAccessInfo = {
  hasAccount: boolean;
  email: string;
  clientName: string | null;
  children: MockClientChildAccess[];
};

const BRUNO_CLIENT_EMAIL = "bruno@example.com";
const BRUNO_CLIENT_ACCESS: MockClientAccessInfo = {
  hasAccount: true,
  email: BRUNO_CLIENT_EMAIL,
  clientName: "Bruno",
  children: [
    {
      id: "child-luisa-001",
      name: "Luísa",
      hasAccess: true,
    },
  ],
};

const resolveClientAccess = (rawEmail: string): MockClientAccessInfo => {
  const email = normalizeEmail(rawEmail ?? "");

  if (email === BRUNO_CLIENT_EMAIL) return BRUNO_CLIENT_ACCESS;

  // Heurística para DEV: e-mails contendo "ana" ou "paid" simulam conta existente
  // com ao menos 1 Livro (Child) com acesso pago.
  if (email.includes("ana") || email.includes("paid")) {
    return {
      hasAccount: true,
      email,
      clientName: "Cliente Demo",
      children: [
        {
          id: "child-paid-001",
          name: "Sofia",
          hasAccess: true,
        },
      ],
    };
  }

  return {
    hasAccount: false,
    email,
    clientName: null,
    children: [],
  };
};

const normalizeDeliveryStatus = (delivery: MockDelivery) => {
  if (delivery.archivedAt) return "archived";
  if (delivery.status === "completed") return "delivered";
  return delivery.status;
};

const maskEmail = (email: string) => {
  const raw = (email ?? "").trim();
  if (!raw || !raw.includes("@")) return "***";

  const [localRaw, domainRaw] = raw.split("@", 2);
  const local = (localRaw ?? "").trim();
  const domain = (domainRaw ?? "").trim();

  const localMask = !local
    ? "***"
    : local.length === 1
      ? "*"
      : `${local[0]}***`;

  if (!domain) return `${localMask}@***`;

  const parts = domain.split(".");
  if (parts.length >= 2) {
    const first = parts[0] ?? "";
    const rest = parts.slice(1).join(".");
    const firstMask = !first
      ? "***"
      : first.length === 1
        ? "*"
        : `${first[0]}***`;
    return rest
      ? `${localMask}@${firstMask}.${rest}`
      : `${localMask}@${firstMask}`;
  }

  const domainMask = domain.length === 1 ? "*" : `${domain[0]}***`;
  return `${localMask}@${domainMask}`;
};

const toDeliveryResponse = (delivery: MockDelivery) => ({
  id: delivery.id,
  partner_id: delivery.partnerId,
  title: delivery.title,
  client_name: delivery.clientName,
  description: delivery.description,
  event_date: delivery.eventDate,
  status: normalizeDeliveryStatus(delivery),
  assets_count: delivery.assetsCount,
  voucher_code: delivery.voucherCode,
  credit_status: delivery.creditStatus ?? null,
  is_archived: Boolean(delivery.archivedAt),
  archived_at: delivery.archivedAt ?? null,
  created_at: delivery.createdAt,
  updated_at: delivery.updatedAt,
});

const unauthorizedResponse = () =>
  HttpResponse.json(
    {
      error: {
        code: "auth.credentials.invalid",
        message: "Credenciais inválidas.",
        trace_id: "mock-trace-auth",
      },
    },
    { status: 401 },
  );

const sessionRequiredResponse = () =>
  HttpResponse.json(
    {
      error: {
        code: "auth.session.invalid",
        message: "Sessão não autenticada.",
        trace_id: "mock-trace-session",
      },
    },
    { status: 401 },
  );

export const handlers = [
  http.get(withBase("/auth/csrf"), () =>
    HttpResponse.json({ csrf_token: "mock-csrf-token" }),
  ),
  http.post(withBase("/auth/login"), async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email ? normalizeEmail(body.email) : "";
    const password = body.password ?? "";
    const user = registeredUsers.get(email);
    if (!user || user.password !== password) {
      return unauthorizedResponse();
    }
    activeUser = user;
    sessionActive = true;
    localStorage.setItem(STORAGE_KEY, email);
    return HttpResponse.text("", { status: 204 });
  }),
  http.post(withBase("/auth/register"), async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string | null;
    };
    const email = body.email ? normalizeEmail(body.email) : "";
    const password = body.password ?? "";
    if (!email || !password) {
      return HttpResponse.json(
        {
          error: {
            code: "auth.register.invalid",
            message: "Email e senha são obrigatórios.",
            trace_id: "mock-trace-register",
          },
        },
        { status: 422 },
      );
    }
    if (registeredUsers.has(email)) {
      return HttpResponse.json(
        {
          error: {
            code: "auth.user.exists",
            message: "Usuário já existe.",
            trace_id: "mock-trace-register",
          },
        },
        { status: 409 },
      );
    }
    const newUser = makeAccount({ email, password, name: body.name });
    registeredUsers.set(email, newUser);
    activeUser = newUser;
    sessionActive = true;
    return HttpResponse.text("", { status: 201 });
  }),
  http.post(withBase("/auth/logout"), () => {
    sessionActive = false;
    localStorage.removeItem(STORAGE_KEY);
    return HttpResponse.text("", { status: 204 });
  }),
  http.get(withBase("/me"), () =>
    sessionActive
      ? HttpResponse.json(profilePayload())
      : sessionRequiredResponse(),
  ),
  http.get(withBase("/me/usage"), () =>
    HttpResponse.json({
      bytes_used: 1_500_000_000,
      bytes_quota: 2_000_000_000,
      moments_used: 32,
      moments_quota: 60,
    }),
  ),

  // Direct Partner Deliveries (sem voucher)
  http.get(withBase("/me/deliveries/pending"), () => {
    if (!sessionActive) return sessionRequiredResponse();

    const userEmail = normalizeEmail(activeUser.email);

    const items = mutableDeliveries
      .filter((d) => {
        const targetEmail = normalizeEmail(d.targetEmail ?? "");
        const isDirectImport = Boolean(d.directImport) && !d.voucherCode;
        return (
          d.status === "ready" && isDirectImport && targetEmail === userEmail
        );
      })
      .map((d) => ({
        delivery_id: d.id,
        partner_name: mockPartner.studioName ?? mockPartner.name,
        title: d.title,
        assets_count: d.assetsCount,
        target_email: userEmail,
        target_email_masked: maskEmail(userEmail),
        created_at: d.createdAt,
      }));

    return HttpResponse.json({ items, total: items.length });
  }),

  http.post(
    withBase("/me/deliveries/:deliveryId/import"),
    async ({ params, request }) => {
      if (!sessionActive) return sessionRequiredResponse();

      const deliveryId = String(params.deliveryId);
      const delivery = mutableDeliveries.find((d) => d.id === deliveryId);
      if (!delivery) {
        return HttpResponse.json(
          {
            error: {
              code: "delivery.not_found",
              message: "Entrega não encontrada",
              trace_id: "mock-trace-delivery",
            },
          },
          { status: 404 },
        );
      }

      const userEmail = normalizeEmail(activeUser.email);
      const targetEmail = normalizeEmail(delivery.targetEmail ?? "");
      if (targetEmail && targetEmail !== userEmail) {
        const masked = maskEmail(targetEmail);
        return HttpResponse.json(
          {
            error: {
              code: "delivery.email_mismatch",
              message: `Esta entrega foi enviada para outro e-mail. Faça login com ${masked} para resgatar.`,
              details: { target_email_masked: masked },
              trace_id: "mock-trace-delivery",
            },
          },
          { status: 403 },
        );
      }

      const isDirectImport =
        Boolean(delivery.directImport) && !delivery.voucherCode;
      if (!isDirectImport) {
        return HttpResponse.json(
          {
            error: {
              code: "delivery.not_direct_import",
              message:
                "Esta entrega não está habilitada para importação direta.",
              trace_id: "mock-trace-delivery",
            },
          },
          { status: 400 },
        );
      }

      const body = (await request.json()) as {
        idempotency_key?: string;
        action?:
          | { type: "EXISTING_CHILD"; child_id: string }
          | { type: "NEW_CHILD"; child_name?: string };
      };

      const action = body.action;
      if (
        !action ||
        (action.type !== "EXISTING_CHILD" && action.type !== "NEW_CHILD")
      ) {
        return HttpResponse.json(
          {
            error: {
              code: "request.validation_error",
              message: "Payload invalido",
              trace_id: "mock-trace-delivery",
            },
          },
          { status: 422 },
        );
      }

      let childId: string;
      if (action.type === "EXISTING_CHILD") {
        childId = action.child_id;
      } else {
        const newChild: Child = {
          id: nanoid(),
          name: action.child_name?.trim() || "Novo Livro",
          birthday: null,
          avatarUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mutableChildren.push(newChild);
        childId = newChild.id;
      }

      const momentId = nanoid();
      const moment: Moment = {
        id: momentId,
        childId,
        title: delivery.title,
        summary: "Importado de entrega do fotógrafo",
        occurredAt: null,
        templateKey: null,
        status: "draft",
        privacy: "private",
        payload: {},
        media: [],
        rev: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: null,
      };
      mutableMoments.unshift(moment);

      // Marca como concluída para não aparecer mais em pendentes
      delivery.status = "completed";
      delivery.updatedAt = new Date().toISOString();

      return HttpResponse.json({
        success: true,
        delivery_id: delivery.id,
        assets_transferred: delivery.assetsCount,
        child_id: childId,
        moment_id: momentId,
        message: "Entrega importada com sucesso.",
      });
    },
  ),
  http.get(withBase("/children"), () =>
    HttpResponse.json({
      items: mutableChildren.map(toChildResponse),
      next: null,
    }),
  ),
  http.post(withBase("/children"), async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      birthday?: string;
      avatar_url?: string;
    };
    const child: Child = {
      id: nanoid(),
      name: body.name,
      birthday: body.birthday ?? null,
      avatarUrl: body.avatar_url ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mutableChildren.push(child);
    return HttpResponse.json(toChildResponse(child), { status: 201 });
  }),
  http.get(withBase("/moments"), ({ request }) => {
    const url = new URL(request.url);
    const childId = url.searchParams.get("child_id");
    const moments = childId
      ? mutableMoments.filter((moment) => moment.childId === childId)
      : mutableMoments;
    return HttpResponse.json({
      items: moments.map(toMomentResponse),
      next: null,
    });
  }),
  http.get(withBase("/moments/:momentId"), ({ params }) => {
    const moment = mutableMoments.find((item) => item.id === params.momentId);
    if (!moment) {
      return HttpResponse.json(
        {
          error: {
            code: "moment.not_found",
            message: "Momento não encontrado",
            trace_id: "mock-trace",
          },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json(toMomentResponse(moment));
  }),
  http.post(withBase("/moments"), async ({ request }) => {
    const body = (await request.json()) as {
      child_id: string;
      title: string;
      summary?: string;
      template_key?: string;
      occurred_at?: string;
      payload?: Record<string, unknown>;
    };
    const moment: Moment = {
      id: nanoid(),
      childId: body.child_id,
      title: body.title,
      summary: body.summary ?? "",
      occurredAt: body.occurred_at ?? null,
      templateKey: body.template_key ?? null,
      status: "draft",
      privacy: "private",
      payload: body.payload ?? {},
      media: [],
      rev: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null,
    };
    mutableMoments.unshift(moment);
    return HttpResponse.json(toMomentResponse(moment), { status: 201 });
  }),
  http.get(withBase("/guestbook"), ({ request }) => {
    const url = new URL(request.url);
    const childId = url.searchParams.get("child_id");
    const entries = childId
      ? mutableGuestbook.filter((entry) => entry.childId === childId)
      : mutableGuestbook;
    return HttpResponse.json({
      items: entries.map(toGuestbookResponse),
      next: null,
    });
  }),
  http.post(withBase("/guestbook"), async ({ request }) => {
    const body = (await request.json()) as {
      child_id: string;
      author_name: string;
      author_email?: string;
      message: string;
    };
    const entry: GuestbookEntry = {
      id: nanoid(),
      childId: body.child_id,
      authorName: body.author_name,
      authorEmail: body.author_email ?? null,
      message: body.message,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    mutableGuestbook.unshift(entry);
    return HttpResponse.json(toGuestbookResponse(entry), { status: 201 });
  }),
  http.get(withBase("/children/:childId/health/measurements"), ({ params }) => {
    const measurements = mutableMeasurements.filter(
      (measurement) => measurement.childId === params.childId,
    );
    return HttpResponse.json(measurements.map(toHealthResponse));
  }),
  http.post(withBase("/health/measurements"), async ({ request }) => {
    const body = (await request.json()) as CreateHealthMeasurementInput;
    const measurement: HealthMeasurement = {
      id: nanoid(),
      childId: body.childId,
      date: body.date,
      weight: body.weight,
      height: body.height,
    };
    mutableMeasurements.push(measurement);
    return HttpResponse.json(toHealthResponse(measurement), { status: 201 });
  }),
  http.get(withBase("/health/vaccines"), ({ request }) => {
    const url = new URL(request.url);
    const childId = url.searchParams.get("child_id");
    const vaccines = childId
      ? mutableVaccines.filter((vaccine) => vaccine.childId === childId)
      : mutableVaccines;
    return HttpResponse.json({
      items: vaccines.map(toVaccineResponse),
      next: null,
    });
  }),

  // ==========================================================================
  // Partner Portal Handlers
  // ==========================================================================

  // Partner profile - /partner/me
  http.get(withBase("/partner/me"), () => {
    if (!sessionActive) return sessionRequiredResponse();
    if (activeUser.role !== "photographer") {
      return HttpResponse.json(
        {
          error: {
            code: "partner.not_found",
            message: "Perfil de parceiro não encontrado",
          },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      id: mockPartner.id,
      name: mockPartner.name,
      email: mockPartner.email,
      studio_name: mockPartner.studioName,
      phone: mockPartner.phone,
      logo_url: mockPartner.logoUrl,
      voucher_balance: mockPartner.voucherBalance,
      status: mockPartner.status,
      created_at: mockPartner.createdAt,
    });
  }),

  // Partner dashboard stats - /partner/me/stats
  http.get(withBase("/partner/me/stats"), () => {
    if (!sessionActive) return sessionRequiredResponse();
    if (activeUser.role !== "photographer") {
      return HttpResponse.json(
        {
          error: {
            code: "partner.forbidden",
            message: "Acesso restrito a parceiros",
          },
        },
        { status: 403 },
      );
    }
    const deliveries = mutableDeliveries;
    const reservedCredits = deliveries.filter(
      (d) => (d.creditStatus ?? null) === "reserved" && !d.archivedAt,
    ).length;
    return HttpResponse.json({
      voucher_balance: mockPartner.voucherBalance,
      reserved_credits: reservedCredits,
      total_deliveries: deliveries.length,
      ready_deliveries: deliveries.filter((d) => d.status === "ready").length,
      delivered_deliveries: deliveries.filter(
        (d) => normalizeDeliveryStatus(d) === "delivered",
      ).length,
      total_vouchers: deliveries.filter((d) => d.voucherCode).length,
      redeemed_vouchers: deliveries.filter(
        (d) => normalizeDeliveryStatus(d) === "delivered",
      ).length,
      pending_vouchers: deliveries.filter((d) => d.status === "ready").length,
      total_assets: deliveries.reduce((sum, d) => sum + d.assetsCount, 0),
    });
  }),

  // Partner deliveries list
  http.get(withBase("/partner/deliveries"), ({ request }) => {
    if (!sessionActive) return sessionRequiredResponse();
    if (activeUser.role !== "photographer") {
      return HttpResponse.json(
        {
          error: {
            code: "partner.forbidden",
            message: "Acesso restrito a parceiros",
          },
        },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const statusFilter =
      url.searchParams.get("status_filter") ??
      url.searchParams.get("status") ??
      undefined;
    const includeArchivedParam =
      url.searchParams.get("include_archived") ?? "false";
    const includeArchived =
      includeArchivedParam === "true" || includeArchivedParam === "1";

    const limitRaw = url.searchParams.get("limit") ?? "20";
    const offsetRaw = url.searchParams.get("offset") ?? "0";
    const limit = Math.max(
      1,
      Math.min(100, Number.parseInt(limitRaw, 10) || 20),
    );
    const offset = Math.max(0, Number.parseInt(offsetRaw, 10) || 0);

    const totalAll = mutableDeliveries.length;
    const archivedCount = mutableDeliveries.filter((d) =>
      Boolean(d.archivedAt),
    ).length;

    const byStatus: Record<string, number> = {
      draft: 0,
      pending_upload: 0,
      processing: 0,
      ready: 0,
      delivered: 0,
    };

    for (const d of mutableDeliveries) {
      if (d.archivedAt) continue;
      const s = normalizeDeliveryStatus(d);
      if (typeof byStatus[s] === "number") byStatus[s] += 1;
    }

    const shouldIncludeArchived =
      includeArchived || statusFilter === "archived";

    const filtered = mutableDeliveries.filter((d) => {
      const s = normalizeDeliveryStatus(d);
      if (!shouldIncludeArchived && s === "archived") return false;
      if (statusFilter && s !== statusFilter) return false;
      return true;
    });

    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);

    return HttpResponse.json({
      deliveries: page.map(toDeliveryResponse),
      total,
      aggregations: {
        total: totalAll,
        archived: archivedCount,
        by_status: byStatus,
      },
    });
  }),

  // Check client access - /partner/check-access
  http.get(withBase("/partner/check-access"), ({ request }) => {
    if (!sessionActive) return sessionRequiredResponse();
    if (activeUser.role !== "photographer") {
      return HttpResponse.json(
        {
          error: {
            code: "partner.forbidden",
            message: "Acesso restrito a parceiros",
          },
        },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const emailParam = url.searchParams.get("email") ?? "";
    const email = normalizeEmail(emailParam);
    if (!email) {
      return HttpResponse.json(
        {
          error: {
            code: "request.validation_error",
            message: "Parâmetro 'email' é obrigatório",
          },
        },
        { status: 422 },
      );
    }

    const access = resolveClientAccess(email);
    const hasPaidChild = access.children.some((c) => c.hasAccess);

    const message = !access.hasAccount
      ? "Não encontramos uma conta para este e-mail. Para este ensaio, será necessário gerar voucher (1 crédito)."
      : hasPaidChild
        ? "Conta encontrada. Você pode escolher um Livro existente (grátis) ou criar um novo Livro (1 crédito)."
        : "Conta encontrada, mas sem Livro ativo. Para este ensaio, use Novo Livro (1 crédito).";

    return HttpResponse.json({
      has_access: access.hasAccount,
      email: access.email,
      client_name: access.clientName,
      children: access.children.map((c) => ({
        id: c.id,
        name: c.name,
        has_access: c.hasAccess,
      })),
      message,
    });
  }),

  // Validação silenciosa (eligibilidade) - /partner/check-eligibility
  http.post(withBase("/partner/check-eligibility"), async ({ request }) => {
    if (!sessionActive) return sessionRequiredResponse();
    if (activeUser.role !== "photographer") {
      return HttpResponse.json(
        {
          error: {
            code: "partner.forbidden",
            message: "Acesso restrito a parceiros",
          },
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { email?: string };
    const email = normalizeEmail(body.email ?? "");
    const access = resolveClientAccess(email);
    const isEligible =
      access.hasAccount && access.children.some((c) => c.hasAccess);

    return HttpResponse.json({
      is_eligible: isEligible,
      reason: isEligible ? "EXISTING_ACTIVE_CHILD" : "NEW_USER",
    });
  }),

  // Create delivery
  http.post(withBase("/partner/deliveries"), async ({ request }) => {
    if (!sessionActive) return sessionRequiredResponse();
    if (activeUser.role !== "photographer") {
      return HttpResponse.json(
        {
          error: {
            code: "partner.forbidden",
            message: "Acesso restrito a parceiros",
          },
        },
        { status: 403 },
      );
    }
    const body = (await request.json()) as {
      target_email?: string;
      title?: string;
      client_name?: string;
      child_name?: string;
      intended_import_action?: "EXISTING_CHILD" | "NEW_CHILD";
      target_child_id?: string;
      description?: string;
      event_date?: string;
    };

    const targetEmail = normalizeEmail(body.target_email ?? "");
    if (!targetEmail) {
      return HttpResponse.json(
        {
          error: {
            code: "request.validation_error",
            message: "Payload invalido",
          },
        },
        { status: 422 },
      );
    }

    const access = resolveClientAccess(targetEmail);
    const canUseExisting =
      access.hasAccount && access.children.some((c) => c.hasAccess);

    const intendedImportAction =
      body.intended_import_action ??
      (canUseExisting ? "EXISTING_CHILD" : "NEW_CHILD");
    const targetChildId = body.target_child_id?.trim() || "";

    if (intendedImportAction === "EXISTING_CHILD") {
      const paidChildren = access.children.filter((c) => c.hasAccess);
      const validChild = paidChildren.some((c) => c.id === targetChildId);
      if (!access.hasAccount || !targetChildId || !validChild) {
        return HttpResponse.json(
          {
            error: {
              code: "request.validation_error",
              message:
                "Para Livro existente, selecione um Livro válido com acesso pago.",
            },
          },
          { status: 422 },
        );
      }
    }
    const title =
      body.title?.trim() ||
      `Ensaio - ${body.child_name?.trim() || body.client_name?.trim() || targetEmail}`;

    const newDelivery: MockDelivery = {
      id: `delivery-${nanoid(8)}`,
      partnerId: mockPartner.id,
      title,
      clientName: body.client_name ?? null,
      targetEmail,
      targetChildId:
        intendedImportAction === "EXISTING_CHILD" ? targetChildId : null,
      directImport: access.hasAccount,
      description: body.description ?? null,
      eventDate: body.event_date ?? null,
      status: "draft",
      assetsCount: 0,
      voucherCode: null,
      creditStatus:
        intendedImportAction === "EXISTING_CHILD" ? "not_required" : "reserved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mutableDeliveries.unshift(newDelivery);
    return HttpResponse.json(toDeliveryResponse(newDelivery), { status: 201 });
  }),

  // Get single delivery
  http.get(withBase("/partner/deliveries/:deliveryId"), ({ params }) => {
    if (!sessionActive) return sessionRequiredResponse();
    const delivery = mutableDeliveries.find((d) => d.id === params.deliveryId);
    if (!delivery) {
      return HttpResponse.json(
        {
          error: {
            code: "delivery.not_found",
            message: "Entrega não encontrada",
          },
        },
        { status: 404 },
      );
    }
    // Return detailed delivery with assets
    return HttpResponse.json({
      ...toDeliveryResponse(delivery),
      description: delivery.description,
      event_date: delivery.eventDate,
      assets: [], // Mock empty assets for now
    });
  }),

  // Finalize delivery (voucher card / direct import link)
  http.post(
    withBase("/partner/deliveries/:deliveryId/finalize"),
    async ({ params, request }) => {
      if (!sessionActive) return sessionRequiredResponse();
      if (activeUser.role !== "photographer") {
        return HttpResponse.json(
          {
            error: {
              code: "partner.forbidden",
              message: "Acesso restrito a parceiros",
            },
          },
          { status: 403 },
        );
      }

      const delivery = mutableDeliveries.find(
        (d) => d.id === params.deliveryId,
      );
      if (!delivery) {
        return HttpResponse.json(
          {
            error: {
              code: "delivery.not_found",
              message: "Entrega não encontrada",
            },
          },
          { status: 404 },
        );
      }

      const body = (await request.json().catch(() => ({}))) as {
        beneficiary_name?: string;
        message?: string;
        voucher_prefix?: string;
        expires_days?: number;
      };

      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "";

      const baseImportUrl = `${origin}/jornada/importar-entrega/${encodeURIComponent(delivery.id)}`;
      const importUrl = delivery.targetChildId
        ? `${baseImportUrl}?childId=${encodeURIComponent(delivery.targetChildId)}`
        : baseImportUrl;

      if (delivery.directImport) {
        delivery.status = "ready";
        delivery.updatedAt = new Date().toISOString();

        return HttpResponse.json({
          mode: "direct_import",
          voucher_code: null,
          redeem_url: null,
          qr_data: null,
          import_url: importUrl,
          studio_name: mockPartner.studioName ?? mockPartner.name,
          studio_logo_url: mockPartner.logoUrl,
          beneficiary_name: body.beneficiary_name ?? null,
          message: body.message ?? "",
          assets_count: delivery.assetsCount,
          expires_at: null,
        });
      }

      const prefix = (body.voucher_prefix ?? "BB").trim() || "BB";
      const code = `${prefix}-${nanoid(6).toUpperCase()}`;
      delivery.voucherCode = code;
      delivery.status = "ready";
      delivery.updatedAt = new Date().toISOString();

      return HttpResponse.json({
        mode: "voucher",
        voucher_code: code,
        redeem_url: `${origin}/voucher/redeem/${encodeURIComponent(code)}`,
        qr_data: code,
        import_url: null,
        studio_name: mockPartner.studioName ?? mockPartner.name,
        studio_logo_url: mockPartner.logoUrl,
        beneficiary_name: body.beneficiary_name ?? null,
        message: body.message ?? "",
        assets_count: delivery.assetsCount,
        expires_at: null,
      });
    },
  ),

  // Credit packages - synced with backend CREDIT_PACKAGES
  // Values from apps/api/babybook_api/routes/partner_portal.py
  http.get(withBase("/partner/credits/packages"), () => {
    return HttpResponse.json([
      {
        id: "pack_5",
        name: "Pacote Inicial",
        voucher_count: 5,
        price_cents: 85000, // R$ 850
        pix_price_cents: 78000, // R$ 780
        unit_price_cents: 17000, // R$ 170/unid
        savings_percent: 0,
        is_popular: false,
      },
      {
        id: "pack_10",
        name: "Pacote Profissional",
        voucher_count: 10,
        price_cents: 149000, // R$ 1.490
        pix_price_cents: 135000, // R$ 1.350
        unit_price_cents: 14900, // R$ 149/unid
        savings_percent: 12,
        is_popular: true,
      },
      {
        id: "pack_25",
        name: "Pacote Estúdio",
        voucher_count: 25,
        price_cents: 322500, // R$ 3.225
        pix_price_cents: 287500, // R$ 2.875
        unit_price_cents: 12900, // R$ 129/unid
        savings_percent: 24,
        is_popular: false,
      },
    ]);
  }),

  // Purchase credits - mock Stripe checkout
  http.post(withBase("/partner/credits/purchase"), async ({ request }) => {
    if (!sessionActive) return sessionRequiredResponse();
    if (activeUser.role !== "photographer") {
      return HttpResponse.json(
        {
          error: {
            code: "partner.forbidden",
            message: "Acesso restrito a parceiros",
          },
        },
        { status: 403 },
      );
    }
    const body = (await request.json()) as {
      package_id: string;
      payment_method?: "pix" | "card";
    };

    const paymentMethod = body.payment_method ?? "card";

    // Package lookup based on real backend values
    const packages: Record<
      string,
      {
        name: string;
        voucher_count: number;
        price_cents: number;
        pix_price_cents: number;
      }
    > = {
      pack_5: {
        name: "Pacote Inicial",
        voucher_count: 5,
        price_cents: 85000,
        pix_price_cents: 78000,
      },
      pack_10: {
        name: "Pacote Profissional",
        voucher_count: 10,
        price_cents: 149000,
        pix_price_cents: 135000,
      },
      pack_25: {
        name: "Pacote Estúdio",
        voucher_count: 25,
        price_cents: 322500,
        pix_price_cents: 287500,
      },
    };
    const pkg = packages[body.package_id] || packages["pack_5"];

    const amount_cents =
      paymentMethod === "pix" ? pkg.pix_price_cents : pkg.price_cents;

    // In mock mode, redirect back to partner dashboard with success
    return HttpResponse.json({
      checkout_id: `chk_${nanoid(16)}`,
      checkout_url: `/partner?credits_added=true&package=${body.package_id}&method=${paymentMethod}`,
      package: {
        id: body.package_id,
        ...pkg,
      },
      payment_method: paymentMethod,
      amount_cents,
      max_installments_no_interest: 3,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    });
  }),

  // Partner onboarding (registration)
  http.post(withBase("/partner/onboarding"), async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      email: string;
      password: string;
      studio_name?: string;
      phone?: string;
    };
    const email = normalizeEmail(body.email);
    if (registeredUsers.has(email)) {
      return HttpResponse.json(
        { error: { code: "auth.user.exists", message: "Email já cadastrado" } },
        { status: 409 },
      );
    }
    // Create new partner account
    const newUser = makeAccount({
      email,
      password: body.password,
      name: body.name,
      role: "photographer",
    });
    registeredUsers.set(email, newUser);
    return HttpResponse.json(
      {
        success: true,
        message: "Cadastro realizado com sucesso! Aguarde a aprovação.",
        partner_id: nanoid(),
        status: "pending_approval",
      },
      { status: 201 },
    );
  }),
];

type CreateHealthMeasurementInput = {
  childId: string;
  date: string;
  weight?: number;
  height?: number;
};
