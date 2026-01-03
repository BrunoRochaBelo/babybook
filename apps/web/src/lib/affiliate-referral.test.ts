import {
  captureAffiliateReferralFromSearch,
  clearAffiliateReferral,
  getAffiliateReferralCode,
} from "./affiliate-referral";

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(String(key), String(value));
    },
    removeItem(key: string) {
      map.delete(String(key));
    },
    clear() {
      map.clear();
    },
  } as Storage;
}

describe("affiliate-referral", () => {
  beforeEach(() => {
    const mem = createMemoryStorage();
    Object.defineProperty(window, "localStorage", {
      value: mem,
      configurable: true,
      enumerable: true,
      writable: false,
    });
    // Alguns runtimes expõem localStorage também em globalThis
    Object.defineProperty(globalThis, "localStorage", {
      value: mem,
      configurable: true,
      enumerable: true,
      writable: false,
    });

    try {
      if (typeof localStorage.clear === "function") {
        localStorage.clear();
      } else if (
        typeof localStorage.length === "number" &&
        typeof localStorage.key === "function" &&
        typeof localStorage.removeItem === "function"
      ) {
        // Alguns polyfills não expõem clear(); iteramos para limpar.
        // eslint-disable-next-line no-constant-condition
        while (localStorage.length > 0) {
          const k = localStorage.key(0);
          if (!k) break;
          localStorage.removeItem(k);
        }
      } else {
        // fallback: remove apenas o que nossos testes escrevem
        localStorage.removeItem("@babybook/affiliate-referral/v1");
      }
    } catch {
      // ignore
    }
    vi.restoreAllMocks();
  });

  it("captura ref válida e retorna o código", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    const code = captureAffiliateReferralFromSearch("?ref=alice-influ-01");
    expect(code).toBe("alice-influ-01");

    expect(getAffiliateReferralCode()).toBe("alice-influ-01");
  });

  it("ignora ref inválida (não persiste)", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    const code = captureAffiliateReferralFromSearch("?ref=@@@bad@@@");
    expect(code).toBeUndefined();

    expect(getAffiliateReferralCode()).toBeUndefined();
  });

  it("expira por TTL e limpa storage", () => {
    // 30 dias = 2_592_000_000 ms
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    captureAffiliateReferralFromSearch("?ref=bob-creator-01", {
      ttlMs: 60_000, // 1 minuto (teste)
    });
    expect(getAffiliateReferralCode()).toBe("bob-creator-01");

    // Avança o "tempo" pra além do TTL
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000 + 60_001);

    expect(getAffiliateReferralCode()).toBeUndefined();
  });

  it("clearAffiliateReferral remove o valor", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    captureAffiliateReferralFromSearch("?ref=alice-influ-01");
    expect(getAffiliateReferralCode()).toBe("alice-influ-01");

    clearAffiliateReferral();
    expect(getAffiliateReferralCode()).toBeUndefined();
  });
});
