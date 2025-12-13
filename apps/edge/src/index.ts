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
import { cors } from "hono/cors";
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
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("*", logger());
app.use("*", cors());

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
