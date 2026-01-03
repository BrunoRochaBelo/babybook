import { describe, expect, it } from "vitest";
import { seedDb, computeBalanceCents } from "./db";

describe("affiliates mocks db", () => {
  it("calcula saldo não-negativo", () => {
    const db = seedDb();
    const affiliateId = db.affiliates[0]!.id;
    const balance = computeBalanceCents(db, affiliateId);
    expect(balance).toBeGreaterThanOrEqual(0);
  });
});
