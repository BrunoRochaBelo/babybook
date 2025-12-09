/**
 * Checkout Module - Entry point
 *
 * Exporta todos os componentes do checkout:
 * - Modal principal
 * - Pagamento direto
 * - Resgate de voucher
 * - Compra de presente
 * - Utilidades de segurança
 */

export {
  openCheckoutModal,
  closeCheckoutModal,
  mountCheckout,
  setupCheckoutTriggers,
} from "./checkoutModal";

export { setupPaymentForm } from "./paymentForm";
export { setupVoucherRedemption } from "./voucherRedemption";
export { setupGiftPurchase } from "./giftPurchase";

// Security utilities
export {
  escapeHtml,
  sanitizeEmail,
  sanitizeName,
  sanitizeMessage,
  sanitizeVoucherCode,
  sanitizeCardNumber,
  sanitizeCvv,
  sanitizeExpiry,
  isValidEmail,
  checkRateLimit,
  clearRateLimit,
  logSecurityEvent,
} from "./security";
