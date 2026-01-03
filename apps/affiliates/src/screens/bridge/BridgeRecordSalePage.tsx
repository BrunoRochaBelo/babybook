import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  findAffiliateIdByCode,
  loadDb,
  registerSale,
  saveDb,
} from "../../mocks/db";

function useQuery() {
  const search = useLocation().search;
  return useMemo(() => new URLSearchParams(search), [search]);
}

function isMockEnabled() {
  const flag = (import.meta.env.VITE_ENABLE_MSW ?? "false")
    .toString()
    .toLowerCase();
  return (
    flag !== "false" && (import.meta.env.DEV || import.meta.env.MODE === "test")
  );
}

function isAllowedReferrer(): boolean {
  // Bridge só faz sentido em dev/test, e é um "atalho" para persistir venda no
  // localStorage do portal. Mesmo assim, fazemos um guardrail para evitar spam.
  if (typeof document === "undefined") return true;

  const raw = (import.meta.env.VITE_AFFILIATE_BRIDGE_ALLOWED_REFERRERS ?? "")
    .toString()
    .trim();

  const allowList = raw
    ? raw
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
        .map((origin: string) => origin.replace(/\/$/, ""))
    : [
        // defaults práticos para o monorepo
        "http://localhost:5173", // apps/web
        "http://localhost:5174",
        "http://localhost:5175",
      ];

  // Alguns navegadores/políticas podem omitir referrer; não bloqueamos nesse caso.
  if (!document.referrer) return true;

  try {
    const refOrigin = new URL(document.referrer).origin;
    return allowList.includes(refOrigin);
  } catch {
    return false;
  }
}

export function BridgeRecordSalePage() {
  const query = useQuery();
  const [status, setStatus] = useState<
    "idle" | "ok" | "ignored" | "invalid" | "error"
  >("idle");

  useEffect(() => {
    if (!isMockEnabled()) {
      setStatus("ignored");
      return;
    }

    if (!isAllowedReferrer()) {
      setStatus("ignored");
      return;
    }

    const affiliateCode = (query.get("affiliate_code") ?? "").trim();
    const amountRaw = (query.get("amount_cents") ?? "").trim();
    const orderId = (query.get("order_id") ?? "").trim() || undefined;
    const occurredAt = (query.get("occurred_at") ?? "").trim() || undefined;

    const amount = Number(amountRaw);
    // Guardrails: evita valores absurdos/injeção acidental
    const MAX_AMOUNT_CENTS = 200_000_00; // R$ 200k
    if (
      !affiliateCode ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > MAX_AMOUNT_CENTS
    ) {
      setStatus("invalid");
      return;
    }

    try {
      const db = loadDb();
      const affiliateId = findAffiliateIdByCode(db, affiliateCode);
      if (!affiliateId) {
        setStatus("invalid");
        return;
      }

      registerSale(db, {
        affiliate_id: affiliateId,
        amount_cents: Math.floor(amount),
        order_id: orderId,
        occurred_at: occurredAt,
      });
      saveDb(db);
      setStatus("ok");
    } catch (err) {
      console.error("[affiliates] bridge record sale failed", err);
      setStatus("error");
    }
  }, [query]);

  // Página minimalista: costuma ser carregada via iframe invisível.
  return (
    <div
      style={{ padding: 12, fontFamily: "system-ui, sans-serif", fontSize: 12 }}
    >
      {status === "ok" ? "ok" : status}
    </div>
  );
}

export default BridgeRecordSalePage;
