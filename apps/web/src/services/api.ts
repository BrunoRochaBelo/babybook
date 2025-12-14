/**
 * @deprecated
 * Este módulo é legado (axios + token em localStorage) e NÃO deve ser usado.
 * Mantido temporariamente para evitar imports antigos quebrarem.
 *
 * Use `@/lib/api-client` (fetch + cookies + CSRF).
 */

export { apiClient, ApiError } from "../lib/api-client";
