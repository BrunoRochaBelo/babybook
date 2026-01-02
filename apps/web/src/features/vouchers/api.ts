/**
 * Voucher API Service
 *
 * API calls for voucher validation and redemption.
 */

import { apiClient } from "../../lib/api-client";
import type {
  VoucherValidationResult,
  VoucherRedemptionRequest,
  VoucherRedemptionResult,
} from "./types";

const API_BASE = "/vouchers";

/**
 * Validate a voucher code without redeeming it
 */
export async function validateVoucher(
  code: string,
): Promise<VoucherValidationResult> {
  return apiClient.post<VoucherValidationResult>(`${API_BASE}/validate`, {
    code,
  });
}

/**
 * Redeem a voucher code
 *
 * If user is authenticated, voucher is linked to their account.
 * If not, a new account can be created with the provided credentials.
 */
export async function redeemVoucher(
  request: VoucherRedemptionRequest,
): Promise<VoucherRedemptionResult> {
  return apiClient.post<VoucherRedemptionResult>(`${API_BASE}/redeem`, request);
}

/**
 * Get user's redeemed vouchers
 */
export async function getMyVouchers(): Promise<VoucherValidationResult[]> {
  const response = await apiClient.get<VoucherValidationResult[]>(`${API_BASE}/me`);
  return response || [];
}

/**
 * Check if a voucher code is available (for quick validation)
 */
export async function checkVoucherAvailability(
  code: string,
): Promise<{ available: boolean; reason?: string }> {
  return apiClient.get<{ available: boolean; reason?: string }>(
    `${API_BASE}/check/${encodeURIComponent(code)}`,
  );
}
