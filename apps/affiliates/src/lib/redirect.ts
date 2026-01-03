export function sanitizeRedirectTo(
  value: string | null | undefined,
  fallback: string = "/login",
): string {
  if (!value) return fallback;

  // Apenas caminhos internos (evita open redirect)
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  if (value.includes("\u0000")) return fallback;
  if (value.length > 2048) return fallback;

  return value;
}
