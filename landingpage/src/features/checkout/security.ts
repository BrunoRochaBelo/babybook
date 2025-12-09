/**
 * Security utilities for Checkout Module
 *
 * Proteção contra XSS e validação de entrada
 */

/**
 * Escape HTML entities to prevent XSS attacks
 * Always use this when interpolating user input into HTML strings
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe || typeof unsafe !== "string") return "";

  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitize email for display (escapes HTML but keeps email format)
 */
export function sanitizeEmail(email: string): string {
  return escapeHtml(email.trim().toLowerCase());
}

/**
 * Sanitize name for display
 */
export function sanitizeName(name: string): string {
  // Remove potentially dangerous characters but keep accents
  const cleaned = name
    .trim()
    .replace(/[<>&"']/g, "")
    .slice(0, 100); // Limit length

  return escapeHtml(cleaned);
}

/**
 * Sanitize message/text for display
 */
export function sanitizeMessage(message: string): string {
  // Remove script tags and limit length
  const cleaned = message
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/[<>]/g, "")
    .slice(0, 500); // Limit length

  return escapeHtml(cleaned);
}

/**
 * Validate voucher code format
 * Only allows alphanumeric and hyphen characters
 */
export function sanitizeVoucherCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 20);
}

/**
 * Validate and format card number (only digits)
 */
export function sanitizeCardNumber(input: string): string {
  return input.replace(/\D/g, "").slice(0, 16);
}

/**
 * Validate CVV (only digits, 3-4 length)
 */
export function sanitizeCvv(input: string): string {
  return input.replace(/\D/g, "").slice(0, 4);
}

/**
 * Validate expiry date (MM/YY format)
 */
export function sanitizeExpiry(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Rate limiting helper
 * Prevents form submission spam
 */
const submissionTimestamps: Map<string, number[]> = new Map();

export function checkRateLimit(
  formId: string,
  maxAttempts: number = 3,
  windowMs: number = 60000,
): boolean {
  const now = Date.now();
  const attempts = submissionTimestamps.get(formId) || [];

  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(
    (timestamp) => now - timestamp < windowMs,
  );

  if (recentAttempts.length >= maxAttempts) {
    return false; // Rate limited
  }

  recentAttempts.push(now);
  submissionTimestamps.set(formId, recentAttempts);
  return true;
}

/**
 * Clear rate limit for a form (e.g., after successful submission)
 */
export function clearRateLimit(formId: string): void {
  submissionTimestamps.delete(formId);
}

/**
 * Generate secure nonce for CSRF-like protection
 * Note: Real CSRF protection should be handled server-side
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Log security events (for monitoring)
 */
export function logSecurityEvent(event: string, details?: unknown): void {
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    console.warn("🔒 Security Event:", event, details);
  }

  // In production, this would send to a security monitoring service
  // Example: sendToSecurityMonitor(event, details);
}
