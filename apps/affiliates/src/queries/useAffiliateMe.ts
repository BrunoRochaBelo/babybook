import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  affiliateSchema,
  Affiliate,
  affiliateSaleSchema,
  AffiliateSale,
  affiliatePayoutSchema,
  AffiliatePayout,
  affiliateProgramConfigSchema,
  AffiliateProgramConfig,
} from "@babybook/contracts";

type AffiliateMeResponse = {
  affiliate: unknown;
  sales: unknown[];
  payouts: unknown[];
  program: unknown;
  balance_cents: number;
};

export function useAffiliateMe() {
  return useQuery({
    queryKey: ["affiliate", "me"],
    queryFn: async (): Promise<{
      affiliate: Affiliate;
      sales: AffiliateSale[];
      payouts: AffiliatePayout[];
      program: AffiliateProgramConfig;
      balanceCents: number;
    }> => {
      const data = await apiFetch<AffiliateMeResponse>("/affiliate/me");
      return {
        affiliate: affiliateSchema.parse(data.affiliate),
        sales: (data.sales ?? []).map((s) => affiliateSaleSchema.parse(s)),
        payouts: (data.payouts ?? []).map((p) =>
          affiliatePayoutSchema.parse(p),
        ),
        program: affiliateProgramConfigSchema.parse(data.program),
        balanceCents: data.balance_cents,
      };
    },
  });
}
