import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "@babybook/affiliates-session/v1";

function createMemoryStorage() {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = {};
    },
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
  };
}

describe("affiliates sessionStore", () => {
  beforeEach(() => {
    const mem = createMemoryStorage();
    Object.defineProperty(globalThis, "localStorage", {
      value: mem,
      configurable: true,
    });
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "localStorage", {
        value: mem,
        configurable: true,
      });
    }
  });

  it("carrega sessão legada com affiliate_id (snake_case)", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        role: "affiliate",
        email: "Alice@Influ.dev",
        affiliate_id: "aff-legacy-1",
      }),
    );

    vi.resetModules();
    const mod = await import("./sessionStore");

    const session = mod.useSessionStore.getState().session;
    expect(session).toEqual({
      role: "affiliate",
      email: "Alice@Influ.dev",
      affiliateId: "aff-legacy-1",
    });
  });

  it("carrega sessão atual com affiliateId (camelCase)", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        role: "affiliate",
        email: "alice@influ.dev",
        affiliateId: "aff-new-1",
      }),
    );

    vi.resetModules();
    const mod = await import("./sessionStore");

    const session = mod.useSessionStore.getState().session;
    expect(session).toEqual({
      role: "affiliate",
      email: "alice@influ.dev",
      affiliateId: "aff-new-1",
    });
  });
});
