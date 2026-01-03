import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMockComplete } from "@/hooks/api";
import { useUserProfile } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { getAffiliateReferralCode } from "@/lib/affiliate-referral";

function amountCentsForPackage(packageKey: string) {
  // TODO: alinhar com tabela real de preços quando o backend estiver pronto.
  if (packageKey === "unlimited_social") return 297_00;
  return 297_00;
}

function sendSaleToAffiliatesBridge(input: {
  affiliateCode: string;
  amountCents: number;
  orderId?: string;
}) {
  const enableFlag = (import.meta.env.VITE_ENABLE_AFFILIATE_BRIDGE ?? "true")
    .toString()
    .toLowerCase();
  const enabled =
    enableFlag !== "false" &&
    (import.meta.env.DEV || import.meta.env.MODE === "test");

  if (!enabled) return;
  if (typeof document === "undefined") return;

  const origin = (
    import.meta.env.VITE_AFFILIATES_PORTAL_ORIGIN ?? "http://localhost:5176"
  )
    .toString()
    .replace(/\/$/, "");

  const url = new URL(`${origin}/bridge/record-sale`);
  url.searchParams.set("affiliate_code", input.affiliateCode);
  url.searchParams.set("amount_cents", String(input.amountCents));
  if (input.orderId) {
    url.searchParams.set("order_id", input.orderId);
  }

  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.setAttribute("aria-hidden", "true");
  iframe.src = url.toString();

  const cleanup = () => {
    try {
      iframe.remove();
    } catch {
      // ignore
    }
  };

  iframe.onload = () => {
    // dá tempo do app do outro lado persistir no localStorage
    setTimeout(cleanup, 250);
  };

  document.body.appendChild(iframe);
  // fallback cleanup
  setTimeout(cleanup, 2500);
}

function useQuery() {
  const search = useLocation().search;
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const query = useQuery();
  const mockComplete = useMockComplete();
  const { refetch } = useUserProfile();

  useEffect(() => {
    const run = async () => {
      const accountId = query.get("account_id");
      const packageKey = query.get("package_key") || "unlimited_social";
      const affiliateCode =
        query.get("affiliate_code") ?? getAffiliateReferralCode();
      if (accountId) {
        try {
          await mockComplete.mutateAsync({
            accountId,
            packageKey,
            affiliateCode: affiliateCode ?? undefined,
          });

          if (typeof affiliateCode === "string" && affiliateCode) {
            sendSaleToAffiliatesBridge({
              affiliateCode,
              amountCents: amountCentsForPackage(packageKey),
              orderId: query.get("order_id") ?? undefined,
            });
          }

          // re-fetch profile and navigate to app
          await refetch();
          navigate("/jornada");
        } catch (err) {
          console.error(err);
        }
      }
    };

    void run();
  }, [mockComplete, navigate, query, refetch]);

  return (
    <div className="p-6 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-semibold mb-4">Pagamento confirmado</h1>
      <p className="mb-4">Redirecionando para a aplicação...</p>
      <Button onClick={() => navigate("/jornada")}>Ir para a aplicação</Button>
    </div>
  );
}

export default CheckoutSuccessPage;
