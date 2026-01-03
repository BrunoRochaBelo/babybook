import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  affiliateSchema,
  Affiliate,
  affiliateSaleSchema,
  AffiliateSale,
  affiliatePayoutSchema,
  AffiliatePayout,
} from "@babybook/contracts";

type DetailResponse = {
  affiliate: unknown;
  sales: unknown[];
  payouts: unknown[];
};

export function useAdminAffiliateDetail(affiliateId: string) {
  return useQuery({
    queryKey: ["admin", "affiliate", affiliateId],
    enabled: affiliateId.trim().length > 0,
    queryFn: async (): Promise<{
      affiliate: Affiliate;
      sales: AffiliateSale[];
      payouts: AffiliatePayout[];
    }> => {
      const data = await apiFetch<DetailResponse>(
        `/admin/affiliates/${affiliateId}`,
      );
      return {
        affiliate: affiliateSchema.parse(data.affiliate),
        sales: (data.sales ?? []).map((s) => affiliateSaleSchema.parse(s)),
        payouts: (data.payouts ?? []).map((p) =>
          affiliatePayoutSchema.parse(p),
        ),
      };
    },
  });
}
