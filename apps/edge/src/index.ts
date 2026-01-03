/**
 * Babybook Edge Worker
 *
 * Cloudflare Worker running at the edge for:
 * 1. Protected file serving (the "Digital Doorman")
 * 2. Share token resolution
 * 3. Edge caching and CDN
 *
 * Benefits:
 * - Bucket R2 fica 100% privado
 * - Sem egress fees no R2
 * - Edge caching (video watched 10x = 9 from cache)
 * - Granular ACL (user can only access their own files)
 * - Low latency (runs in 200+ global POPs)
 */
import { Hono } from "hono";
import { logger } from "hono/logger";
import { z } from "zod";

import { fileRoutes } from "./routes/files";

type Bindings = {
  // API
  API_BASE_URL: string;
  // R2 (S3-compatible) credentials
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_ACCOUNT_ID: string;
  R2_REGION?: string;
  // Optional override (host only). Default: {accountId}.r2.cloudflarestorage.com
  R2_ENDPOINT?: string;
  // JWT secret (same as backend)
  JWT_SECRET: string;

  // Optional: comma-separated allowlist of origins for CORS
  CORS_ALLOWED_ORIGINS?: string;
  // URL do Frontend (SPA)
  APP_BASE_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("*", logger());

// Security headers (baseline)
app.use("*", async (c, next) => {
  await next();

  // HSTS: apenas quando a resposta é servida via HTTPS (ambiente real do worker)
  // Em dev/local, isso tende a não aplicar (protocol http) e evita efeitos colaterais.
  try {
    const url = new URL(c.req.url);
    if (url.protocol === "https:") {
      c.header(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload",
      );
    }
  } catch {
    // ignore
  }

  // Best-effort: aplica em respostas JSON/HTML e também em arquivos proxied.
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
});

// =============================================================================
// Health Check
// =============================================================================

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "babybook-edge",
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// File Routes (Protected Storage Access)
// =============================================================================

// Mount file routes under /v1/file
// Example: GET /v1/file/u/user-uuid/m/moment-uuid/photo.jpg
app.route("/v1/file", fileRoutes);

// =============================================================================
// Guestbook Invite Route
// =============================================================================

app.get("/guestbook/:token", async (c) => {
  const token = c.req.param("token");
  const apiBaseUrl = c.env.API_BASE_URL ?? "http://localhost:8000";
  const appBaseUrl = c.env.APP_BASE_URL ?? "http://localhost:5173";

  // Validate token minimal format
  if (!token || token.length < 10) {
    return c.html("<h1>Link inválido</h1>", 400);
  }

  try {
    const response = await fetch(`${apiBaseUrl}/guestbook/invites/${token}`);

    if (!response.ok) {
      if (response.status === 404) {
        return c.html(
          `
                <!DOCTYPE html>
                <html>
                <head><title>Convite não encontrado</title></head>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1>Convite não encontrado ou expirado 😔</h1>
                    <p>Peça um novo link para quem te convidou.</p>
                </body>
                </html>
             `,
          404,
        );
      }
      throw new Error("API failed");
    }

    const meta = (await response.json()) as { child_name?: unknown };
    const childName =
      typeof meta?.child_name === "string" && meta.child_name.trim()
        ? meta.child_name
        : "seu bebê";

    const title = `Convite: Livro de ${childName}`;
    const description = `Você foi convidado(a) para deixar uma mensagem carinhosa no livro de ${childName}.`;
    const targetUrl = `${appBaseUrl}/guestbook/${token}`;

    return c.html(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${title}</title>
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="${c.req.url}">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        
        <!-- Twitter -->
        <meta property="twitter:card" content="summary">
        <meta property="twitter:title" content="${title}">
        <meta property="twitter:description" content="${description}">

        <meta http-equiv="refresh" content="0;url=${targetUrl}">
        <style>
           body { font-family: -apple-system, system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #F7F3EF; color: #4A4A4A; }
           .loader { border: 4px solid #f3f3f3; border-top: 4px solid #F2995D; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
           @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
         <div class="loader"></div>
         <p>Redirecionando para o BabyBook...</p>
         <script>window.location.href = "${targetUrl}"</script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Guestbook Edge Error:", err);
    // Fallback redirect even if metadata fetch fails?
    // Or show error
    const targetUrl = `${appBaseUrl}/guestbook/${token}`;
    return c.html(`
         <meta http-equiv="refresh" content="0;url=${targetUrl}">
         <body>Redirecionando...</body>
      `);
  }
});

// =============================================================================
// Share Token Routes
// =============================================================================

const paramsSchema = z.object({
  token: z.string().min(10),
});

app.get("/s/:token", async (c) => {
  const parseResult = paramsSchema.safeParse(c.req.param());
  if (!parseResult.success) {
    return c.json(
      { error: { code: "share.token.invalid", message: "Token inválido" } },
      400,
    );
  }

  const apiBaseUrl = c.env.API_BASE_URL ?? "http://localhost:8000";
  const response = await fetch(
    `${apiBaseUrl}/shares/${parseResult.data.token}`,
  );

  if (!response.ok) {
    // Evita cast para `any` e respeita o status de origem.
    // Preserva payload/Content-Type retornados pela API.
    const bodyText = await response.text();
    const contentType =
      response.headers.get("Content-Type") || "application/json";
    return new Response(bodyText, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
      },
    });
  }

  const payload = await response.json();
  return c.html(
    `<html><body><pre>${JSON.stringify(payload, null, 2)}</pre></body></html>`,
  );
});

// =============================================================================
// 404 Handler
// =============================================================================

app.notFound((c) => {
  return c.json(
    {
      error: {
        code: "route.not_found",
        message: "Route not found",
        path: c.req.path,
      },
    },
    404,
  );
});

// =============================================================================
// Error Handler
// =============================================================================

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: {
        code: "internal.error",
        message: "An unexpected error occurred",
      },
    },
    500,
  );
});

export default app;
