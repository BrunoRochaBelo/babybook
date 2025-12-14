import type { MomentMedia } from "@babybook/contracts";

const MEDIA_BASE_URL = (
  (import.meta.env.VITE_MEDIA_BASE_URL as string | undefined) ?? ""
).replace(/\/$/, "");

const isAbsoluteUrl = (value?: string | null): boolean =>
  typeof value === "string" && /^https?:\/\//i.test(value);

const looksLikeUrlScheme = (value: string): boolean => {
  // Bloqueia esquemas (ex.: javascript:, data:, file:, etc.) e URLs protocol-relative (//...)
  const trimmed = value.trim();
  if (trimmed.startsWith("//")) {
    return true;
  }
  // Se houver ':' antes de qualquer '/', é bem provável que seja um esquema
  const colon = trimmed.indexOf(":");
  const slash = trimmed.indexOf("/");
  return colon !== -1 && (slash === -1 || colon < slash);
};

const buildFromKey = (key?: string | null): string | undefined => {
  if (!key) {
    return undefined;
  }
  if (isAbsoluteUrl(key)) {
    return key;
  }
  if (looksLikeUrlScheme(key)) {
    return undefined;
  }
  if (!MEDIA_BASE_URL) {
    return key;
  }
  const sanitizedKey = key.replace(/^\/+/, "");
  return `${MEDIA_BASE_URL}/${sanitizedKey}`;
};

export const getMediaUrl = (
  media: Pick<MomentMedia, "url" | "key" | "variants">,
  preset?: string,
): string | undefined => {
  const variant = preset
    ? media.variants?.find((entry) => entry.preset === preset)
    : undefined;
  const candidateUrl = variant?.url ?? media.url ?? variant?.key ?? media.key;
  if (isAbsoluteUrl(candidateUrl)) {
    return candidateUrl ?? undefined;
  }
  const candidateKey = variant?.key ?? media.key ?? candidateUrl;
  return buildFromKey(candidateKey ?? undefined);
};
