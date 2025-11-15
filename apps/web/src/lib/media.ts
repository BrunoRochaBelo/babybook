import type { MomentMedia } from "@babybook/contracts";

const MEDIA_BASE_URL = (import.meta.env.VITE_MEDIA_BASE_URL ?? "").replace(/\/$/, "");

const isAbsoluteUrl = (value?: string | null): boolean =>
  typeof value === "string" && /^https?:\/\//i.test(value);

const buildFromKey = (key?: string | null): string | undefined => {
  if (!key) {
    return undefined;
  }
  if (isAbsoluteUrl(key)) {
    return key;
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

