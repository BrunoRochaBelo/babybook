/**
 * Voucher Redemption Types
 *
 * Type definitions for the voucher redemption flow.
 */

export interface Voucher {
  id: string;
  code: string;
  partner_id: string;
  partner_name: string;
  delivery_id: string | null;
  beneficiary_id: string | null;
  expires_at: string;
  uses_left: number;
  max_uses: number;
  is_active: boolean;
  created_at: string;
  redeemed_at: string | null;
}

export interface VoucherValidationResult {
  valid: boolean;
  voucher: Voucher | null;
  error_code: string | null;
  error_message: string | null;
  partner_name: string | null;
  delivery_title: string | null;
  assets_count: number;
}

export interface VoucherRedemptionRequest {
  code: string;
  account_id?: string; // If already logged in
  /**
   * Chave de idempotência para tornar o resgate resiliente a duplo clique/retry.
   */
  idempotency_key?: string;
  /**
   * Late binding: define se o resgate deve vincular a um bebê existente
   * ou criar um novo Baby Book.
   */
  action?: "EXISTING_CHILD" | "NEW_CHILD";
  /**
   * Obrigatório quando action=EXISTING_CHILD.
   */
  child_id?: string;
  create_account?: {
    email: string;
    name: string;
    password: string;
  };
}

export interface VoucherRedemptionResult {
  success: boolean;
  voucher_id: string;
  assets_transferred: number;
  child_id: string | null;
  message: string;
  redirect_url: string;
}

export type RedemptionStep =
  | "input"
  | "validation"
  | "account"
  | "decision"
  | "hard_stop"
  | "confirmation"
  | "success"
  | "error";

export interface RedemptionState {
  step: RedemptionStep;
  code: string;
  validation: VoucherValidationResult | null;
  isLoading: boolean;
  error: string | null;
}
