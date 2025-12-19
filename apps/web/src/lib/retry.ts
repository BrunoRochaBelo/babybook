/**
 * Utilitário de retry com backoff exponencial.
 *
 * Permite executar operações que podem falhar temporariamente
 * com tentativas automáticas e delay crescente entre elas.
 */

export interface RetryOptions {
  /** Número máximo de tentativas (padrão: 3) */
  maxAttempts?: number;
  /** Delay base em ms para backoff exponencial (padrão: 100) */
  baseDelayMs?: number;
  /** Multiplicador do delay a cada tentativa (padrão: 2) */
  backoffMultiplier?: number;
  /** Função para determinar se deve fazer retry baseado no erro */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Callback chamado antes de cada retry (útil para logging) */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 100,
  backoffMultiplier: 2,
  shouldRetry: () => true,
  onRetry: () => {},
};

/**
 * Executa uma função com retry automático e backoff exponencial.
 *
 * @example
 * const result = await withRetry(
 *   async () => await fetchSomeData(),
 *   {
 *     maxAttempts: 3,
 *     onRetry: (err, attempt) => console.log(`Tentativa ${attempt} falhou`)
 *   }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Última tentativa - não fazer retry
      if (attempt >= opts.maxAttempts) {
        break;
      }

      // Verifica se deve fazer retry
      if (!opts.shouldRetry(error, attempt)) {
        break;
      }

      // Calcula delay com backoff exponencial
      const delayMs = opts.baseDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1);

      // Callback de retry
      opts.onRetry(error, attempt, delayMs);

      // Aguarda antes da próxima tentativa
      await sleep(delayMs);
    }
  }

  throw lastError;
}

/**
 * Aguarda um determinado tempo em milissegundos.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verifica se um erro é temporário e pode ser retentado.
 * Erros de rede, timeout e certos status HTTP são considerados temporários.
 */
export function isTransientError(error: unknown): boolean {
  // Erros de rede (TypeError no fetch)
  if (error instanceof TypeError) {
    return true;
  }

  // Erros com status HTTP
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    // 5xx são erros de servidor (temporários)
    // 429 é rate limit (temporário)
    // 0 indica falha de rede
    return status === 0 || status === 429 || (status >= 500 && status < 600);
  }

  // Erros com mensagens indicando problemas temporários
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const transientPatterns = [
      "network",
      "fetch",
      "timeout",
      "econnreset",
      "econnrefused",
      "socket",
      "failed to fetch",
    ];
    return transientPatterns.some((pattern) => message.includes(pattern));
  }

  return false;
}
