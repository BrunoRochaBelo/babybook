/**
 * CORS helpers
 *
 * Objetivo: manter compatibilidade com o comportamento atual ("*") quando
 * nenhuma allowlist é configurada, mas permitir endurecimento em produção.
 *
 * Configure via env: CORS_ALLOWED_ORIGINS="https://app.babybook.com,https://babybook.com"
 */

export function getCorsAllowOrigin(
  originHeader: string | null,
  allowedOriginsEnv?: string,
): string | null {
  const allowedOrigins = (allowedOriginsEnv ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  // Backwards-compatible default: allow any origin ("*")
  if (allowedOrigins.length === 0) {
    return "*";
  }

  if (!originHeader) {
    return null;
  }

  return allowedOrigins.includes(originHeader) ? originHeader : null;
}
