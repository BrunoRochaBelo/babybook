type StoredAffiliateReferral = {
  code: string;
  capturedAt: string;
  expiresAt: string;
};

const STORAGE_KEY = "@babybook/affiliate-referral/v1";

// Default: 30 dias
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function nowMs() {
  return Date.now();
}

function isValidAffiliateCode(code: string) {
  // Conservador: evita lixo em querystring virar atribuição.
  // Aceita: letras/números + hífen/underscore, 3..64 chars.
  return /^[a-z0-9][a-z0-9_-]{2,63}$/i.test(code);
}

function readSearchParam(search: string, keys: string[]): string | undefined {
  if (!search) return undefined;
  const params = new URLSearchParams(search);
  for (const key of keys) {
    const raw = params.get(key);
    if (!raw) continue;
    const value = raw.trim();
    if (!value) continue;
    return value;
  }
  return undefined;
}

export function captureAffiliateReferralFromSearch(
  search: string,
  options?: {
    ttlMs?: number;
  },
): string | undefined {
  if (typeof window === "undefined") return undefined;

  const raw = readSearchParam(search, ["ref", "affiliate", "affiliate_code"]);
  if (!raw) return undefined;

  const code = raw.trim();
  if (!isValidAffiliateCode(code)) return undefined;

  const ttlMs =
    typeof options?.ttlMs === "number" && Number.isFinite(options.ttlMs)
      ? Math.max(60_000, Math.floor(options.ttlMs))
      : DEFAULT_TTL_MS;

  const capturedAt = new Date(nowMs()).toISOString();
  const expiresAt = new Date(nowMs() + ttlMs).toISOString();

  const stored: StoredAffiliateReferral = {
    code,
    capturedAt,
    expiresAt,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // best-effort
  }

  return code;
}

export function getAffiliateReferralCode(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<StoredAffiliateReferral>;
    if (typeof parsed?.code !== "string" || !parsed.code) return undefined;
    if (typeof parsed?.expiresAt !== "string" || !parsed.expiresAt) {
      return undefined;
    }
    const expires = Date.parse(parsed.expiresAt);
    if (!Number.isFinite(expires) || expires <= nowMs()) {
      clearAffiliateReferral();
      return undefined;
    }
    return parsed.code;
  } catch {
    return undefined;
  }
}

export function clearAffiliateReferral() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort
  }
}
