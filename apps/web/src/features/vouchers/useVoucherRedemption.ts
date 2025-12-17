/**
 * useVoucherRedemption Hook
 *
 * React hook for managing the voucher redemption flow.
 * Handles validation, redemption, and state management.
 */

import { useState, useCallback } from "react";
import { validateVoucher, redeemVoucher } from "./api";
import type {
  RedemptionState,
  RedemptionStep,
  VoucherValidationResult,
  VoucherRedemptionRequest,
  VoucherRedemptionResult,
} from "./types";

const initialState: RedemptionState = {
  step: "input",
  code: "",
  validation: null,
  isLoading: false,
  error: null,
};

export interface UseVoucherRedemptionReturn {
  state: RedemptionState;
  setCode: (code: string) => void;
  validate: () => Promise<VoucherValidationResult | null>;
  redeem: (
    request?: Partial<VoucherRedemptionRequest>,
  ) => Promise<VoucherRedemptionResult | null>;
  goToStep: (step: RedemptionStep) => void;
  reset: () => void;
}

export function useVoucherRedemption(): UseVoucherRedemptionReturn {
  const [state, setState] = useState<RedemptionState>(initialState);

  const setCode = useCallback((code: string) => {
    setState((prev) => ({
      ...prev,
      code: code.toUpperCase().trim(),
      error: null,
    }));
  }, []);

  const validate =
    useCallback(async (): Promise<VoucherValidationResult | null> => {
      if (!state.code) {
        setState((prev) => ({
          ...prev,
          error: "Por favor, insira o código do voucher",
        }));
        return null;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await validateVoucher(state.code);

        if (result.valid) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            validation: result,
          }));
          return result;
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: result.error_message ?? "Voucher inválido",
            step: "error",
          }));
          return null;
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Erro ao validar voucher",
          step: "error",
        }));
        return null;
      }
    }, [state.code]);

  const redeem = useCallback(
    async (
      request?: Partial<VoucherRedemptionRequest>,
    ): Promise<VoucherRedemptionResult | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const redemptionRequest: VoucherRedemptionRequest = {
          code: state.code,
          ...request,
        };

        const result = await redeemVoucher(redemptionRequest);

        if (result.success) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            step: "success",
          }));

          return result;
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: result.message ?? "Erro ao resgatar voucher",
            step: "error",
          }));
          return null;
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Erro ao resgatar voucher",
          step: "error",
        }));
        return null;
      }
    },
    [state.code],
  );

  const goToStep = useCallback((step: RedemptionStep) => {
    setState((prev) => ({ ...prev, step, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    setCode,
    validate,
    redeem,
    goToStep,
    reset,
  };
}

export default useVoucherRedemption;
