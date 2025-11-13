import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client/client";
import { quotaSchema } from "@babybook/contracts";
export function useQuotaUsage() {
    return useQuery({
        queryKey: ["me", "usage"],
        queryFn: async () => {
            const data = await apiClient.get("/me/usage", {
                traceName: "dashboard.usage"
            });
            return quotaSchema.parse(data);
        },
        staleTime: 1000 * 60
    });
}
