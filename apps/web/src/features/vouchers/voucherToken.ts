const STORAGE_KEY = "babybook:voucher:redemptionCode";

/**
 * Persiste o código do voucher durante navegação/redirects (login/cadastro).
 * Importante: o código é a “chave” do resgate, então tratamos como imutável.
 */
export function persistVoucherCode(code: string) {
  if (!code) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignora (ex.: storage desabilitado)
  }
}

export function readPersistedVoucherCode(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearPersistedVoucherCode() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function buildLoginRedirectToVoucherRedeem(code: string) {
  // Mantém a rota pública e o código no caminho.
  return `/resgate/${encodeURIComponent(code)}`;
}
