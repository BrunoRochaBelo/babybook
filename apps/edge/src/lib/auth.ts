/**
 * Auth utilities for Edge Worker
 *
 * Handles JWT verification and token extraction from requests.
 * Uses the 'jose' library for robust JWT validation.
 */
import { jwtVerify, type JWTPayload } from "jose";

/**
 * JWT payload structure from our API
 */
export interface BabybookJwtPayload extends JWTPayload {
  sub: string; // user_id (UUID)
  account_id?: string; // account_id (UUID)
  email?: string;
  role?: "user" | "photographer" | "admin";
  partner_id?: string; // for photographers
}

/**
 * Extracts JWT token from request
 *
 * Looks in order:
 * 1. Authorization: Bearer <token>
 * 2. Cookie: bb_token=<token>
 * 3. Query param: ?token=<token> (for special cases like video embeds)
 */
export function extractToken(request: Request): string | null {
  // 1. Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // 2. Cookie
  const cookieHeader = request.headers.get("Cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/bb_token=([^;]+)/);
    if (match) {
      return match[1];
    }
  }

  // 3. Query param (for video embeds, images in emails, etc)
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get("token");
  if (tokenParam) {
    return tokenParam;
  }

  return null;
}

/**
 * Verifies JWT token using jose library
 *
 * @param token - The JWT string
 * @param secret - The shared secret (same as backend)
 * @returns Decoded payload or null if invalid
 */
export async function verifyJwt(
  token: string,
  secret: string
): Promise<BabybookJwtPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    return payload as BabybookJwtPayload;
  } catch {
    // Token invalid, expired, or wrong signature
    return null;
  }
}

/**
 * Error class for auth failures
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string = "auth.failed",
    public status: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Verifies user has access to a specific path
 *
 * Path structure: u/{user_id}/...
 * User can only access their own folder (sub === user_id in path)
 */
export function verifyUserPathAccess(
  payload: BabybookJwtPayload,
  objectKey: string
): void {
  // Extract user_id from path: u/USER_UUID/...
  const pathParts = objectKey.split("/");
  if (pathParts.length < 2) {
    throw new AuthError("Invalid path", "path.invalid", 400);
  }

  const targetUserId = pathParts[1];

  // User's sub (or account_id) must match the path
  if (payload.sub !== targetUserId && payload.account_id !== targetUserId) {
    throw new AuthError(
      "You do not have access to this file",
      "access.denied",
      403
    );
  }
}

/**
 * Verifies user has partner/photographer role
 */
export function verifyPartnerRole(payload: BabybookJwtPayload): void {
  if (payload.role !== "photographer" && payload.role !== "admin") {
    throw new AuthError(
      "Partner access required",
      "role.insufficient",
      403
    );
  }
}

/**
 * Verifies partner has access to specific partner path
 *
 * Path structure: partners/{partner_id}/...
 */
export function verifyPartnerPathAccess(
  payload: BabybookJwtPayload,
  objectKey: string
): void {
  verifyPartnerRole(payload);

  // Admins can access any partner path
  if (payload.role === "admin") {
    return;
  }

  // Extract partner_id from path: partners/PARTNER_UUID/...
  const pathParts = objectKey.split("/");
  if (pathParts.length < 2) {
    throw new AuthError("Invalid path", "path.invalid", 400);
  }

  const targetPartnerId = pathParts[1];

  if (payload.partner_id !== targetPartnerId) {
    throw new AuthError(
      "You do not have access to this partner's files",
      "access.denied",
      403
    );
  }
}
