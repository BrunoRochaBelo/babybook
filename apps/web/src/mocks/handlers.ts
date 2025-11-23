import { http, HttpResponse } from "msw";
import { nanoid } from "nanoid";
import {
  mockChildren,
  mockGuestbookEntries,
  mockHealthMeasurements,
  mockHealthVaccines,
  mockMoments,
  mockUser,
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
}: {
  email: string;
  password: string;
  name?: string | null;
}): MockAccount => ({
  id: randomId(),
  email,
  name: name?.trim() && name.length > 0 ? name.trim() : email.split("@")[0],
  locale: defaultLocale,
  role: defaultRole,
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

const registeredUsers = new Map<string, MockAccount>();
const seededAccount = makeAccount({
  email: devEmail,
  password: devPassword,
  name: mockUser.name,
});
registeredUsers.set(devEmail, seededAccount);
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
];

type CreateHealthMeasurementInput = {
  childId: string;
  date: string;
  weight?: number;
  height?: number;
};
