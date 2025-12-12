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

let activeUser: MockAccount = seededAccount;
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

const toDeliveryResponse = (delivery: MockDelivery) => ({
  id: delivery.id,
  partner_id: delivery.partnerId,
  title: delivery.title,
  client_name: delivery.clientName,
  description: delivery.description,
  event_date: delivery.eventDate,
  status: delivery.status,
  assets_count: delivery.assetsCount,
  voucher_code: delivery.voucherCode,
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
        { error: { code: "partner.not_found", message: "Perfil de parceiro não encontrado" } },
        { status: 404 }
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
        { error: { code: "partner.forbidden", message: "Acesso restrito a parceiros" } },
        { status: 403 }
      );
    }
    const deliveries = mockDeliveries;
    return HttpResponse.json({
      voucher_balance: mockPartner.voucherBalance,
      total_deliveries: deliveries.length,
      ready_deliveries: deliveries.filter(d => d.status === "ready").length,
      delivered_deliveries: deliveries.filter(d => d.status === "completed").length,
      total_vouchers: deliveries.filter(d => d.voucherCode).length,
      redeemed_vouchers: deliveries.filter(d => d.status === "completed").length,
      pending_vouchers: deliveries.filter(d => d.status === "ready").length,
      total_assets: deliveries.reduce((sum, d) => sum + d.assetsCount, 0),
    });
  }),

  // Partner deliveries list
  http.get(withBase("/partner/deliveries"), () => {
    if (!sessionActive) return sessionRequiredResponse();
    if (activeUser.role !== "photographer") {
      return HttpResponse.json(
        { error: { code: "partner.forbidden", message: "Acesso restrito a parceiros" } },
        { status: 403 }
      );
    }
    return HttpResponse.json({
      deliveries: mutableDeliveries.map(toDeliveryResponse),
      total: mutableDeliveries.length,
    });
  }),

  // Create delivery
  http.post(withBase("/partner/deliveries"), async ({ request }) => {
    if (!sessionActive) return sessionRequiredResponse();
    if (activeUser.role !== "photographer") {
      return HttpResponse.json(
        { error: { code: "partner.forbidden", message: "Acesso restrito a parceiros" } },
        { status: 403 }
      );
    }
    const body = (await request.json()) as {
      title: string;
      client_name?: string;
      description?: string;
      event_date?: string;
    };
    const newDelivery: MockDelivery = {
      id: `delivery-${nanoid(8)}`,
      partnerId: mockPartner.id,
      title: body.title,
      clientName: body.client_name ?? null,
      description: body.description ?? null,
      eventDate: body.event_date ?? null,
      status: "draft",
      assetsCount: 0,
      voucherCode: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mutableDeliveries.unshift(newDelivery);
    return HttpResponse.json(toDeliveryResponse(newDelivery), { status: 201 });
  }),

  // Get single delivery
  http.get(withBase("/partner/deliveries/:deliveryId"), ({ params }) => {
    if (!sessionActive) return sessionRequiredResponse();
    const delivery = mutableDeliveries.find(d => d.id === params.deliveryId);
    if (!delivery) {
      return HttpResponse.json(
        { error: { code: "delivery.not_found", message: "Entrega não encontrada" } },
        { status: 404 }
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

  // Credit packages - synced with backend CREDIT_PACKAGES
  // Values from apps/api/babybook_api/routes/partner_portal.py
  http.get(withBase("/partner/credits/packages"), () => {
    return HttpResponse.json([
      { 
        id: "pack_5", 
        name: "Pacote Inicial", 
        voucher_count: 5, 
        price_cents: 60000,       // R$ 600
        unit_price_cents: 12000,  // R$ 120/unid
        savings_percent: 0,
        is_popular: false,
      },
      { 
        id: "pack_10", 
        name: "Pacote Profissional", 
        voucher_count: 10, 
        price_cents: 100000,      // R$ 1.000
        unit_price_cents: 10000,  // R$ 100/unid
        savings_percent: 17,
        is_popular: true,
      },
      { 
        id: "pack_25", 
        name: "Pacote Estúdio", 
        voucher_count: 25,
        price_cents: 200000,      // R$ 2.000
        unit_price_cents: 8000,   // R$ 80/unid
        savings_percent: 33,
        is_popular: false,
      },
    ]);
  }),

  // Purchase credits - mock Stripe checkout
  http.post(withBase("/partner/credits/purchase"), async ({ request }) => {
    if (!sessionActive) return sessionRequiredResponse();
    if (activeUser.role !== "photographer") {
      return HttpResponse.json(
        { error: { code: "partner.forbidden", message: "Acesso restrito a parceiros" } },
        { status: 403 }
      );
    }
    const body = (await request.json()) as { package_id: string };
    
    // Package lookup based on real backend values
    const packages: Record<string, { name: string; voucher_count: number; price_cents: number }> = {
      "pack_5": { name: "Pacote Inicial", voucher_count: 5, price_cents: 60000 },
      "pack_10": { name: "Pacote Profissional", voucher_count: 10, price_cents: 100000 },
      "pack_25": { name: "Pacote Estúdio", voucher_count: 25, price_cents: 200000 },
    };
    const pkg = packages[body.package_id] || packages["pack_5"];
    
    // In mock mode, redirect back to partner dashboard with success
    return HttpResponse.json({
      checkout_id: `chk_${nanoid(16)}`,
      checkout_url: `/partner?credits_added=true&package=${body.package_id}`,
      package: {
        id: body.package_id,
        ...pkg,
      },
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
        { status: 409 }
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
    return HttpResponse.json({
      success: true,
      message: "Cadastro realizado com sucesso! Aguarde a aprovação.",
      partner_id: nanoid(),
      status: "pending_approval",
    }, { status: 201 });
  }),
];

type CreateHealthMeasurementInput = {
  childId: string;
  date: string;
  weight?: number;
  height?: number;
};
