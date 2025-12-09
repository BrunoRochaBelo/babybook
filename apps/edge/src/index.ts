/**
 * Babybook Edge Worker
 *
 * Cloudflare Worker running at the edge for:
 * 1. Protected file serving (the "Digital Doorman")
 * 2. Share token resolution
 * 3. Edge caching and CDN
 *
 * Benefits:
 * - B2 bucket stays 100% private
 * - Zero egress cost (Bandwidth Alliance: CF ↔ B2 = free)
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
  // B2/S3 credentials
  B2_ACCESS_KEY_ID: string;
  B2_SECRET_ACCESS_KEY: string;
  B2_BUCKET_NAME: string;
  B2_ENDPOINT: string;
  B2_REGION?: string;
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
      400 as any,
    );
  }

  const apiBaseUrl = c.env.API_BASE_URL ?? "http://localhost:8000";
  const response = await fetch(
    `${apiBaseUrl}/shares/${parseResult.data.token}`,
  );

  if (!response.ok) {
    return c.json(await response.json(), response.status as any);
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
