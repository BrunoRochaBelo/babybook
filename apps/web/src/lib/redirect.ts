export function sanitizeRedirectTo(
  value: string | null | undefined,
  fallback: string = "/jornada",
): string {
  if (!value) return fallback;

  // Only allow internal, absolute paths within this SPA.
  // This blocks open-redirect style payloads like:
  // - https://evil.com
  // - //evil.com
  // - \\evil.com
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  if (value.includes("\u0000")) return fallback;

  // Keep it reasonably bounded (avoid pathological memory/URL cases)
  if (value.length > 2048) return fallback;

  return value;
}
