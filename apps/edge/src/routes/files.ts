/**
 * File Routes Handler
 *
 * The "Porteiro Digital" - Digital Doorman
 *
 * Intercepts file requests and applies security rules based on path:
 * - u/{user_id}/... → Requires valid JWT with matching user_id
 * - partners/{partner_id}/... → Requires photographer/admin role
 * - sys/... → Public (logos, placeholders, defaults)
 * - tmp/... → Blocked (internal use only)
 *
 * Benefits:
 * 1. Bucket R2 fica 100% privado
 * 2. Sem egress fees no R2
 * 3. Edge caching (video watched 10x = 9 from cache)
 * 4. Granular ACL (user can only access their own files)
 */
import { Hono } from "hono";
import { cache } from "hono/cache";

import { getCorsAllowOrigin } from "../lib/cors";

import {
  extractToken,
  verifyJwt,
  verifyUserPathAccess,
  verifyPartnerPathAccess,
  AuthError,
  type BabybookJwtPayload,
} from "../lib/auth";
import {
  createSignedRequest,
  fetchAndTransform,
  type StorageConfig,
} from "../lib/storage";

interface FileBindings {
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
  // Optional: API base URL for validating share tokens
  API_BASE_URL?: string;

  // Optional: comma-separated allowlist of origins for CORS
  // When undefined/empty, defaults to "*" for backwards compatibility.
  CORS_ALLOWED_ORIGINS?: string;
}

const fileRoutes = new Hono<{ Bindings: FileBindings }>();

/**
 * Cache middleware for static assets
 * Only applies to successful responses from sys/ folder
 */
fileRoutes.use(
  "/sys/*",
  cache({
    cacheName: "babybook-sys-cache",
    cacheControl: "public, max-age=86400", // 24 hours for system assets
  }),
);

// Preflight handler com allowlist (se configurada)
fileRoutes.on("OPTIONS", ["/*"], (c) => {
  const originHeader = c.req.header("Origin") ?? null;
  const allowOrigin = getCorsAllowOrigin(
    originHeader,
    c.env.CORS_ALLOWED_ORIGINS,
  );

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Range, Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
    if (allowOrigin !== "*") {
      headers["Vary"] = "Origin";
    }
  }

  return new Response(null, { status: 204, headers });
});

/**
 * Main file handler
 *
 * Route: /v1/file/*
 * Example: /v1/file/u/user-uuid/m/moment-uuid/photo.jpg
 */
fileRoutes.get("/*", async (c) => {
  const objectKey = c.req.path.replace(/^\//, ""); // Remove leading slash

  // Validate path exists
  if (!objectKey || objectKey === "") {
    return c.json(
      { error: { code: "path.empty", message: "No file path provided" } },
      400,
    );
  }

  try {
    // Apply security rules based on path prefix
    await applySecurityRules(c.req.raw, c.env, objectKey);

    // Build storage config from environment
    const storageConfig: StorageConfig = {
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
      bucketName: c.env.R2_BUCKET_NAME,
      accountId: c.env.R2_ACCOUNT_ID,
      endpoint: c.env.R2_ENDPOINT,
      region: c.env.R2_REGION,
    };

    // Create signed request to R2
    const signedRequest = await createSignedRequest(
      storageConfig,
      objectKey,
      c.req.raw,
    );

    // Fetch and transform response
    const cacheMaxAge = getCacheMaxAge(objectKey);
    const originHeader = c.req.header("Origin") ?? null;
    const corsAllowOrigin = getCorsAllowOrigin(
      originHeader,
      c.env.CORS_ALLOWED_ORIGINS,
    );
    const response = await fetchAndTransform(
      signedRequest,
      objectKey,
      cacheMaxAge,
      corsAllowOrigin,
      objectKey.startsWith("sys/") ? "public" : "private",
    );

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return c.json(
        { error: { code: error.code, message: error.message } },
        error.status as 400 | 401 | 403,
      );
    }

    console.error("File fetch error:", error);
    return c.json(
      { error: { code: "file.fetch_failed", message: "Failed to fetch file" } },
      500,
    );
  }
});

/**
 * HEAD request handler (for checking file existence/size)
 */
fileRoutes.on("HEAD", ["/*"], async (c) => {
  const objectKey = c.req.path.replace(/^\//, "");

  if (!objectKey) {
    return new Response(null, { status: 400 });
  }

  try {
    await applySecurityRules(c.req.raw, c.env, objectKey);

    const storageConfig: StorageConfig = {
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
      bucketName: c.env.R2_BUCKET_NAME,
      accountId: c.env.R2_ACCOUNT_ID,
      endpoint: c.env.R2_ENDPOINT,
      region: c.env.R2_REGION,
    };

    const signedRequest = await createSignedRequest(
      storageConfig,
      objectKey,
      c.req.raw,
    );

    const response = await fetch(signedRequest);

    const originHeader = c.req.header("Origin") ?? null;
    const allowOrigin = getCorsAllowOrigin(
      originHeader,
      c.env.CORS_ALLOWED_ORIGINS,
    );
    const headers = new Headers(response.headers);
    if (allowOrigin) {
      headers.set("Access-Control-Allow-Origin", allowOrigin);
      if (allowOrigin !== "*") {
        headers.append("Vary", "Origin");
      }
      headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Authorization, Range");
      headers.set(
        "Access-Control-Expose-Headers",
        "Content-Length, Content-Range, Accept-Ranges",
      );
    }

    // Return only headers, no body
    return new Response(null, {
      status: response.status,
      headers,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(null, { status: error.status });
    }
    return new Response(null, { status: 500 });
  }
});

/**
 * Applies security rules based on path prefix
 */
async function applySecurityRules(
  request: Request,
  env: FileBindings,
  objectKey: string,
): Promise<void> {
  // Determine path prefix
  const prefix = objectKey.split("/")[0];

  switch (prefix) {
    case "u":
      // USER FILES: Strict authentication required
      // User can only access their own folder
      await verifyUserAccess(request, env, objectKey);
      break;

    case "partners":
      // PARTNER FILES: Photographer role required
      // Partner can only access their own deliveries
      await verifyPartnerAccess(request, env, objectKey);
      break;

    case "sys":
      // SYSTEM FILES: Public access (logos, placeholders)
      // No authentication needed
      break;

    case "tmp":
      // TEMPORARY FILES: Always blocked from external access
      // These are for internal processing only
      throw new AuthError(
        "Temporary files are not accessible",
        "access.denied",
        403,
      );

    default:
      // Unknown prefix: Block by default
      throw new AuthError("Access denied to this path", "access.denied", 403);
  }
}

/**
 * Verifies user has access to the requested path
 */
async function verifyUserAccess(
  request: Request,
  env: FileBindings,
  objectKey: string,
): Promise<BabybookJwtPayload> {
  const token = extractToken(request);
  if (!token) {
    throw new AuthError("Authentication required", "auth.required", 401);
  }

  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) {
    throw new AuthError("Invalid or expired token", "auth.invalid", 401);
  }

  // Verify user owns this path
  verifyUserPathAccess(payload, objectKey);

  return payload;
}

/**
 * Verifies partner has access to the requested path
 */
async function verifyPartnerAccess(
  request: Request,
  env: FileBindings,
  objectKey: string,
): Promise<BabybookJwtPayload> {
  const token = extractToken(request);
  if (!token) {
    throw new AuthError("Authentication required", "auth.required", 401);
  }

  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) {
    throw new AuthError("Invalid or expired token", "auth.invalid", 401);
  }

  // Verify partner role and path ownership
  verifyPartnerPathAccess(payload, objectKey);

  return payload;
}

/**
 * Determines cache duration based on path/file type
 */
function getCacheMaxAge(objectKey: string): number {
  const prefix = objectKey.split("/")[0];

  switch (prefix) {
    case "sys":
      // System assets: 24 hours (rarely change)
      return 86400;

    case "u":
      // User files: 4 hours (good balance)
      return 14400;

    case "partners":
      // Partner files: 1 hour (may be updated during delivery)
      return 3600;

    default:
      // Default: 1 hour
      return 3600;
  }
}

export { fileRoutes };
