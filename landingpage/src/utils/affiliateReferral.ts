type StoredAffiliateReferral = {
  code: string;
  capturedAt: string;
  expiresAt: string;
};

const STORAGE_KEY = "@babybook/affiliate-referral/v1";
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function nowMs() {
  return Date.now();
}

function isValidAffiliateCode(code: string) {
  return /^[a-z0-9][a-z0-9_-]{2,63}$/i.test(code);
}

export function captureAffiliateReferralFromLocation(options?: {
  ttlMs?: number;
}) {
  if (typeof window === "undefined") return undefined;

  const params = new URLSearchParams(window.location.search);
  const raw =
    params.get("ref") ??
    params.get("affiliate") ??
    params.get("affiliate_code") ??
    undefined;

  if (!raw) return undefined;
  const code = raw.trim();
  if (!code || !isValidAffiliateCode(code)) return undefined;

  const ttlMs =
    typeof options?.ttlMs === "number" && Number.isFinite(options.ttlMs)
      ? Math.max(60_000, Math.floor(options.ttlMs))
      : DEFAULT_TTL_MS;

  const stored: StoredAffiliateReferral = {
    code,
    capturedAt: new Date(nowMs()).toISOString(),
    expiresAt: new Date(nowMs() + ttlMs).toISOString(),
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
    if (typeof parsed?.expiresAt !== "string" || !parsed.expiresAt)
      return undefined;
    const expires = Date.parse(parsed.expiresAt);
    if (!Number.isFinite(expires) || expires <= nowMs()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return undefined;
    }
    return parsed.code;
  } catch {
    return undefined;
  }
}
