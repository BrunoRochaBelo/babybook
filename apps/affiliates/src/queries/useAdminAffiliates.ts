import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { affiliateSchema, Affiliate } from "@babybook/contracts";

type AdminAffiliatesResponse = {
  items: unknown[];
};

export function useAdminAffiliates() {
  return useQuery({
    queryKey: ["admin", "affiliates"],
    queryFn: async (): Promise<Affiliate[]> => {
      const data = await apiFetch<AdminAffiliatesResponse>("/admin/affiliates");
      return (data.items ?? []).map((item) => affiliateSchema.parse(item));
    },
  });
}
