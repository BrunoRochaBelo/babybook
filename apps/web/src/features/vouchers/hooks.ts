import { useQuery } from "@tanstack/react-query";

import { getMyVouchers } from "./api";
import type { VoucherValidationResult } from "./types";

export const useMyVouchers = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ["my-vouchers"],
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<VoucherValidationResult[]> => getMyVouchers(),
    staleTime: 60_000,
  });
