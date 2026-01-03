import { nanoid } from "nanoid";

export type RawAffiliate = {
  id: string;
  code: string;
  name: string;
  email: string;
  status: "active" | "paused";
  commission_rate: number;
  created_at: string;
  updated_at: string;
  payout_method?: {
    pix_key?: string | null;
    bank_account?: null;
  };
};

export type RawSale = {
  id: string;
  affiliate_id: string;
  order_id: string;
  occurred_at: string;
  amount_cents: number;
  commission_cents: number;
  status: "pending" | "approved" | "refunded";
};

export type RawPayout = {
  id: string;
  affiliate_id: string;
  amount_cents: number;
  status: "requested" | "paid" | "rejected";
  requested_at: string;
  paid_at: string | null;
  note?: string | null;
};

export type RawProgramConfig = {
  default_commission_rate: number;
  minimum_payout_cents: number;
};

export type AffiliatesDb = {
  affiliates: RawAffiliate[];
  sales: RawSale[];
  payouts: RawPayout[];
  program: RawProgramConfig;
  accounts: {
    admin: { email: string; password: string };
    affiliates: Array<{
      email: string;
      password: string;
      affiliate_id: string;
    }>;
  };
};

const DB_KEY = "@babybook/affiliates-db/v1";

const fallbackUuidV4 = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const randomId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return fallbackUuidV4();
};

const nowIso = () => new Date().toISOString();

function toCode(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = nanoid(6).toLowerCase();
  return base.length > 0 ? `${base}-${suffix}` : suffix;
}

export function seedDb(): AffiliatesDb {
  const aliceId = randomId();
  const bobId = randomId();

  const affiliates: RawAffiliate[] = [
    {
      id: aliceId,
      code: "alice-influ-01",
      name: "Alice Influ",
      email: "alice@influ.dev",
      status: "active",
      commission_rate: 0.15,
      created_at: nowIso(),
      updated_at: nowIso(),
      payout_method: { pix_key: "alice@influ.dev" },
    },
    {
      id: bobId,
      code: "bob-creator-01",
      name: "Bob Creator",
      email: "bob@influ.dev",
      status: "paused",
      commission_rate: 0.12,
      created_at: nowIso(),
      updated_at: nowIso(),
      payout_method: { pix_key: null },
    },
  ];

  const sales: RawSale[] = [
    {
      id: randomId(),
      affiliate_id: aliceId,
      order_id: `order_${nanoid(8)}`,
      occurred_at: nowIso(),
      amount_cents: 199_90,
      commission_cents: Math.round(199_90 * 0.15),
      status: "approved",
    },
    {
      id: randomId(),
      affiliate_id: aliceId,
      order_id: `order_${nanoid(8)}`,
      occurred_at: nowIso(),
      amount_cents: 149_90,
      commission_cents: Math.round(149_90 * 0.15),
      status: "pending",
    },
  ];

  const payouts: RawPayout[] = [
    {
      id: randomId(),
      affiliate_id: aliceId,
      amount_cents: 29_98,
      status: "paid",
      requested_at: nowIso(),
      paid_at: nowIso(),
      note: "Pagamento de teste",
    },
  ];

  return {
    affiliates,
    sales,
    payouts,
    program: {
      default_commission_rate: 0.15,
      minimum_payout_cents: 50_00,
    },
    accounts: {
      admin: { email: "admin@babybook.dev", password: "admin123" },
      affiliates: [
        {
          email: "alice@influ.dev",
          password: "affiliate123",
          affiliate_id: aliceId,
        },
        {
          email: "bob@influ.dev",
          password: "affiliate123",
          affiliate_id: bobId,
        },
      ],
    },
  };
}

export function loadDb(): AffiliatesDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const seeded = seedDb();
      saveDb(seeded);
      return seeded;
    }
    return JSON.parse(raw) as AffiliatesDb;
  } catch {
    const seeded = seedDb();
    saveDb(seeded);
    return seeded;
  }
}

export function saveDb(db: AffiliatesDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function createAffiliate(
  db: AffiliatesDb,
  input: { name: string; email: string; commission_rate?: number },
) {
  const id = randomId();
  const created: RawAffiliate = {
    id,
    code: toCode(input.name),
    name: input.name,
    email: input.email.toLowerCase(),
    status: "active",
    commission_rate:
      typeof input.commission_rate === "number" &&
      Number.isFinite(input.commission_rate)
        ? Math.min(1, Math.max(0, input.commission_rate))
        : db.program.default_commission_rate,
    created_at: nowIso(),
    updated_at: nowIso(),
    payout_method: { pix_key: null, bank_account: null },
  };

  db.affiliates.unshift(created);
  db.accounts.affiliates.push({
    email: created.email,
    password: "affiliate123",
    affiliate_id: created.id,
  });
  saveDb(db);
  return created;
}

export function computeBalanceCents(db: AffiliatesDb, affiliateId: string) {
  const commissionApproved = db.sales
    .filter((s) => s.affiliate_id === affiliateId && s.status === "approved")
    .reduce((acc, s) => acc + s.commission_cents, 0);

  const payoutsPaid = db.payouts
    .filter((p) => p.affiliate_id === affiliateId && p.status === "paid")
    .reduce((acc, p) => acc + p.amount_cents, 0);

  const payoutsRequested = db.payouts
    .filter((p) => p.affiliate_id === affiliateId && p.status === "requested")
    .reduce((acc, p) => acc + p.amount_cents, 0);

  return Math.max(0, commissionApproved - payoutsPaid - payoutsRequested);
}

export function registerSale(
  db: AffiliatesDb,
  input: {
    affiliate_id: string;
    amount_cents: number;
    order_id?: string;
    occurred_at?: string;
  },
) {
  const affiliate = db.affiliates.find((a) => a.id === input.affiliate_id);
  if (!affiliate) {
    throw new Error("Afiliado não encontrado");
  }
  if (affiliate.status !== "active") {
    throw new Error("Afiliado está pausado");
  }
  const amount = Math.max(0, Math.floor(input.amount_cents));
  if (amount <= 0) {
    throw new Error("Valor inválido");
  }

  const orderId =
    typeof input.order_id === "string" && input.order_id.trim().length > 0
      ? input.order_id.trim()
      : `order_${nanoid(10)}`;

  const occurredAt =
    typeof input.occurred_at === "string" &&
    Number.isFinite(Date.parse(input.occurred_at))
      ? input.occurred_at
      : nowIso();

  const sale: RawSale = {
    id: randomId(),
    affiliate_id: affiliate.id,
    order_id: orderId,
    occurred_at: occurredAt,
    amount_cents: amount,
    commission_cents: Math.round(amount * affiliate.commission_rate),
    status: "approved",
  };
  db.sales.unshift(sale);
  saveDb(db);
  return sale;
}

export function findAffiliateIdByCode(db: AffiliatesDb, code: string) {
  const normalized = code.trim().toLowerCase();
  const found = db.affiliates.find((a) => a.code.toLowerCase() === normalized);
  return found?.id;
}

export function requestPayout(db: AffiliatesDb, affiliateId: string) {
  const balance = computeBalanceCents(db, affiliateId);
  if (balance < db.program.minimum_payout_cents) {
    throw new Error("Saldo insuficiente para solicitar pagamento");
  }

  const payout: RawPayout = {
    id: randomId(),
    affiliate_id: affiliateId,
    amount_cents: balance,
    status: "requested",
    requested_at: nowIso(),
    paid_at: null,
    note: null,
  };
  db.payouts.unshift(payout);
  saveDb(db);
  return payout;
}
