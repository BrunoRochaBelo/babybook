import { http, HttpResponse } from "msw";
import {
  computeBalanceCents,
  createAffiliate,
  loadDb,
  registerSale,
  requestPayout,
  saveDb,
} from "./db";

type SessionRole = "company_admin" | "affiliate";

// Sessão persistida em localStorage.
// Importante: historicamente já salvamos `affiliate_id` (snake_case) e
// `affiliateId` (camelCase). Em dev, ambos precisam ser aceitos para evitar
// loops de login/401 por incompatibilidade de schema.
type StoredSession = {
  role: SessionRole;
  email: string;
  affiliateId: string | null;
  affiliate_id?: string | null;
};

const SESSION_KEY = "@babybook/affiliates-session/v1";

function normalizeStoredSession(value: unknown): StoredSession | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<StoredSession>;
  const role = v.role;
  const email = v.email;
  if (role !== "company_admin" && role !== "affiliate") return null;
  if (typeof email !== "string" || email.trim().length === 0) return null;
  const affiliateId =
    (typeof v.affiliateId === "string" ? v.affiliateId : null) ??
    (typeof v.affiliate_id === "string" ? v.affiliate_id : null) ??
    null;

  return {
    role,
    email: email.trim().toLowerCase(),
    affiliateId,
  };
}

function getSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return normalizeStoredSession(parsed);
  } catch {
    return null;
  }
}

function setSession(session: StoredSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  // Persistimos em camelCase (compatível com o store do app).
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      role: session.role,
      email: session.email,
      affiliateId: session.affiliateId,
    }),
  );
}

const unauthorizedResponse = () =>
  HttpResponse.json({ message: "Unauthorized" }, { status: 401 });

function getSessionForRole(role: SessionRole): StoredSession | null {
  const session = getSession();
  if (!session || session.role !== role) return null;
  return session;
}

export const handlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json().catch(() => null)) as {
      email?: string;
      password?: string;
      role?: SessionRole;
    } | null;

    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = (body?.password ?? "").toString();
    const role = (body?.role ?? "company_admin") as SessionRole;

    const db = loadDb();

    if (role === "company_admin") {
      if (
        email === db.accounts.admin.email &&
        password === db.accounts.admin.password
      ) {
        const stored: StoredSession = { role, email, affiliateId: null };
        setSession(stored);
        return HttpResponse.json({ role, email, affiliate_id: null });
      }
      return HttpResponse.json(
        { message: "Credenciais inválidas" },
        { status: 401 },
      );
    }

    const match = db.accounts.affiliates.find((a) => a.email === email);
    if (!match || match.password !== password) {
      return HttpResponse.json(
        { message: "Credenciais inválidas" },
        { status: 401 },
      );
    }

    const stored: StoredSession = {
      role,
      email,
      affiliateId: match.affiliate_id,
    };
    setSession(stored);
    return HttpResponse.json({ role, email, affiliate_id: match.affiliate_id });
  }),

  http.get("/api/admin/affiliates", () => {
    const session = getSessionForRole("company_admin");
    if (!session) return unauthorizedResponse();
    const db = loadDb();
    return HttpResponse.json({ items: db.affiliates });
  }),

  http.post("/api/admin/affiliates", async ({ request }) => {
    const session = getSessionForRole("company_admin");
    if (!session) return unauthorizedResponse();
    const body = (await request.json().catch(() => null)) as {
      name?: string;
      email?: string;
      commission_rate?: number;
    } | null;
    const name = (body?.name ?? "").toString().trim();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    if (name.length === 0) {
      return HttpResponse.json(
        { message: "Nome é obrigatório" },
        { status: 400 },
      );
    }
    if (!email.includes("@")) {
      return HttpResponse.json({ message: "Email inválido" }, { status: 400 });
    }
    const db = loadDb();
    if (db.affiliates.some((a) => a.email === email)) {
      return HttpResponse.json(
        { message: "Email já cadastrado" },
        { status: 409 },
      );
    }
    const created = createAffiliate(db, {
      name,
      email,
      commission_rate: body?.commission_rate,
    });
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get("/api/admin/affiliates/:affiliateId", ({ params }) => {
    const session = getSessionForRole("company_admin");
    if (!session) return unauthorizedResponse();
    const affiliateId = params.affiliateId as string;
    const db = loadDb();
    const affiliate = db.affiliates.find((a) => a.id === affiliateId);
    if (!affiliate) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 });
    }
    const sales = db.sales.filter((s) => s.affiliate_id === affiliateId);
    const payouts = db.payouts.filter((p) => p.affiliate_id === affiliateId);
    return HttpResponse.json({ affiliate, sales, payouts });
  }),

  http.patch(
    "/api/admin/affiliates/:affiliateId",
    async ({ params, request }) => {
      const session = getSessionForRole("company_admin");
      if (!session) return unauthorizedResponse();
      const affiliateId = params.affiliateId as string;
      const body = (await request.json().catch(() => null)) as {
        status?: "active" | "paused";
      } | null;
      const db = loadDb();
      const affiliate = db.affiliates.find((a) => a.id === affiliateId);
      if (!affiliate) {
        return HttpResponse.json({ message: "Not found" }, { status: 404 });
      }
      const status = body?.status;
      if (status !== "active" && status !== "paused") {
        return HttpResponse.json(
          { message: "Status inválido" },
          { status: 400 },
        );
      }
      affiliate.status = status;
      affiliate.updated_at = new Date().toISOString();
      saveDb(db);
      return HttpResponse.json(affiliate);
    },
  ),

  http.delete("/api/admin/affiliates/:affiliateId", ({ params }) => {
    const session = getSessionForRole("company_admin");
    if (!session) return unauthorizedResponse();
    const affiliateId = params.affiliateId as string;
    const db = loadDb();
    const idx = db.affiliates.findIndex((a) => a.id === affiliateId);
    if (idx === -1) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 });
    }
    db.affiliates.splice(idx, 1);
    db.sales = db.sales.filter((s) => s.affiliate_id !== affiliateId);
    db.payouts = db.payouts.filter((p) => p.affiliate_id !== affiliateId);
    db.accounts.affiliates = db.accounts.affiliates.filter(
      (a) => a.affiliate_id !== affiliateId,
    );
    saveDb(db);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/admin/sales", async ({ request }) => {
    const session = getSessionForRole("company_admin");
    if (!session) return unauthorizedResponse();
    const body = (await request.json().catch(() => null)) as {
      affiliate_id?: string;
      amount_cents?: number;
    } | null;
    const affiliateId = (body?.affiliate_id ?? "").toString();
    const amount = Number(body?.amount_cents ?? 0);
    const db = loadDb();
    try {
      const sale = registerSale(db, {
        affiliate_id: affiliateId,
        amount_cents: amount,
      });
      return HttpResponse.json(sale, { status: 201 });
    } catch (e) {
      return HttpResponse.json(
        { message: e instanceof Error ? e.message : "Erro" },
        { status: 400 },
      );
    }
  }),

  http.get("/api/affiliate/me", () => {
    const session = getSessionForRole("affiliate");
    if (!session?.affiliateId) return unauthorizedResponse();
    const db = loadDb();
    const affiliate = db.affiliates.find((a) => a.id === session.affiliateId);
    if (!affiliate) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 });
    }
    const sales = db.sales.filter((s) => s.affiliate_id === affiliate.id);
    const payouts = db.payouts.filter((p) => p.affiliate_id === affiliate.id);
    const balance_cents = computeBalanceCents(db, affiliate.id);
    return HttpResponse.json({
      affiliate,
      sales,
      payouts,
      program: db.program,
      balance_cents,
    });
  }),

  http.patch("/api/affiliate/me", async ({ request }) => {
    const session = getSessionForRole("affiliate");
    if (!session?.affiliateId) return unauthorizedResponse();
    const body = (await request.json().catch(() => null)) as {
      payout_method?: { pix_key?: string | null };
    } | null;
    const db = loadDb();
    const affiliate = db.affiliates.find((a) => a.id === session.affiliateId);
    if (!affiliate) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 });
    }
    affiliate.payout_method = {
      pix_key: body?.payout_method?.pix_key ?? null,
      bank_account: null,
    };
    affiliate.updated_at = new Date().toISOString();
    saveDb(db);
    return HttpResponse.json(affiliate);
  }),

  http.post("/api/affiliate/payouts/request", () => {
    const session = getSessionForRole("affiliate");
    if (!session?.affiliateId) return unauthorizedResponse();
    const db = loadDb();
    try {
      const payout = requestPayout(db, session.affiliateId);
      return HttpResponse.json(payout, { status: 201 });
    } catch (e) {
      return HttpResponse.json(
        { message: e instanceof Error ? e.message : "Erro" },
        { status: 400 },
      );
    }
  }),
];
