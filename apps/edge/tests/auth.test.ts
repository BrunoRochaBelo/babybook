/**
 * Tests for Auth utilities
 */
import { describe, it, expect, vi } from "vitest";
import {
  extractToken,
  verifyUserPathAccess,
  verifyPartnerPathAccess,
  verifyPartnerRole,
  AuthError,
  type BabybookJwtPayload,
} from "../src/lib/auth";

describe("extractToken", () => {
  it("extracts token from Authorization header", () => {
    const request = new Request("https://example.com/file", {
      headers: {
        Authorization: "Bearer my-jwt-token",
      },
    });

    expect(extractToken(request)).toBe("my-jwt-token");
  });

  it("extracts token from cookie", () => {
    const request = new Request("https://example.com/file", {
      headers: {
        Cookie: "other=value; bb_token=cookie-token; another=thing",
      },
    });

    expect(extractToken(request)).toBe("cookie-token");
  });

  it("extracts token from query param", () => {
    const request = new Request("https://example.com/file?token=query-token");

    expect(extractToken(request)).toBe("query-token");
  });

  it("prefers Authorization header over cookie", () => {
    const request = new Request("https://example.com/file", {
      headers: {
        Authorization: "Bearer header-token",
        Cookie: "bb_token=cookie-token",
      },
    });

    expect(extractToken(request)).toBe("header-token");
  });

  it("returns null when no token found", () => {
    const request = new Request("https://example.com/file");

    expect(extractToken(request)).toBeNull();
  });
});

describe("verifyUserPathAccess", () => {
  it("allows access when user ID matches path", () => {
    const payload: BabybookJwtPayload = {
      sub: "user-123-uuid",
    };

    expect(() =>
      verifyUserPathAccess(payload, "u/user-123-uuid/m/moment-456/photo.jpg"),
    ).not.toThrow();
  });

  it("allows access when account_id matches path", () => {
    const payload: BabybookJwtPayload = {
      sub: "different-id",
      account_id: "user-123-uuid",
    };

    expect(() =>
      verifyUserPathAccess(payload, "u/user-123-uuid/m/moment-456/photo.jpg"),
    ).not.toThrow();
  });

  it("denies access when user ID does not match path", () => {
    const payload: BabybookJwtPayload = {
      sub: "user-123-uuid",
    };

    expect(() =>
      verifyUserPathAccess(payload, "u/other-user-uuid/m/moment-456/photo.jpg"),
    ).toThrow(AuthError);
  });

  it("throws on invalid path", () => {
    const payload: BabybookJwtPayload = {
      sub: "user-123-uuid",
    };

    expect(() => verifyUserPathAccess(payload, "u")).toThrow(AuthError);
  });
});

describe("verifyPartnerRole", () => {
  it("allows photographer role", () => {
    const payload: BabybookJwtPayload = {
      sub: "user-123",
      role: "photographer",
    };

    expect(() => verifyPartnerRole(payload)).not.toThrow();
  });

  it("allows admin role", () => {
    const payload: BabybookJwtPayload = {
      sub: "user-123",
      role: "admin",
    };

    expect(() => verifyPartnerRole(payload)).not.toThrow();
  });

  it("denies regular user role", () => {
    const payload: BabybookJwtPayload = {
      sub: "user-123",
      role: "user",
    };

    expect(() => verifyPartnerRole(payload)).toThrow(AuthError);
  });

  it("denies undefined role", () => {
    const payload: BabybookJwtPayload = {
      sub: "user-123",
    };

    expect(() => verifyPartnerRole(payload)).toThrow(AuthError);
  });
});

describe("verifyPartnerPathAccess", () => {
  it("allows admin to access any partner path", () => {
    const payload: BabybookJwtPayload = {
      sub: "admin-user",
      role: "admin",
    };

    expect(() =>
      verifyPartnerPathAccess(
        payload,
        "partners/any-partner-uuid/delivery-123/photo.jpg",
      ),
    ).not.toThrow();
  });

  it("allows photographer to access their own partner path", () => {
    const payload: BabybookJwtPayload = {
      sub: "user-123",
      role: "photographer",
      partner_id: "partner-456-uuid",
    };

    expect(() =>
      verifyPartnerPathAccess(
        payload,
        "partners/partner-456-uuid/delivery-123/photo.jpg",
      ),
    ).not.toThrow();
  });

  it("denies photographer access to other partner path", () => {
    const payload: BabybookJwtPayload = {
      sub: "user-123",
      role: "photographer",
      partner_id: "partner-456-uuid",
    };

    expect(() =>
      verifyPartnerPathAccess(
        payload,
        "partners/other-partner-uuid/delivery-123/photo.jpg",
      ),
    ).toThrow(AuthError);
  });

  it("denies regular user access to partner paths", () => {
    const payload: BabybookJwtPayload = {
      sub: "user-123",
      role: "user",
    };

    expect(() =>
      verifyPartnerPathAccess(
        payload,
        "partners/partner-uuid/delivery-123/photo.jpg",
      ),
    ).toThrow(AuthError);
  });
});
