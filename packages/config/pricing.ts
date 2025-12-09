/**
 * Configuração de Pricing Canônica - Baby Book
 *
 * Este arquivo é a fonte única de verdade para todos os valores de pricing
 * públicos do Baby Book. Qualquer atualização de preço deve ser feita aqui.
 *
 * @see docs/PLANO_ATUALIZACAO_ADAPTACAO_MONOREPO.md
 */

/**
 * Valores em centavos para evitar problemas de ponto flutuante
 */
export const PRICING = {
  /**
   * Ticket principal (acesso vitalício à coleção completa)
   */
  TICKET: {
    /** Preço via cartão de crédito em centavos (R$297,00) */
    CARD: 29700,
    /** Preço via PIX em centavos (R$279,00) */
    PIX: 27900,
  },

  /**
   * Pacotes upsell
   */
  UPSELL: {
    /** Pacote de expansão de armazenamento em centavos (R$49,00) */
    STORAGE_PACK: 4900,
    /** Pacote de momentos extras em centavos (R$29,00) */
    MOMENTS_PACK: 2900,
  },

  /**
   * Valores de desconto B2B2C (vouchers/parceiros)
   */
  B2B2C: {
    /** Desconto padrão para vouchers de parceiros em centavos */
    DEFAULT_VOUCHER_DISCOUNT: 5000,
    /** Mínimo de vouchers por compra bulk */
    MIN_BULK_VOUCHERS: 10,
    /** Máximo de vouchers por compra bulk */
    MAX_BULK_VOUCHERS: 1000,
  },

  /**
   * Moeda padrão
   */
  CURRENCY: "BRL" as const,

  /**
   * Código do país para formatação
   */
  LOCALE: "pt-BR" as const,
} as const;

/**
 * Helper para formatar valor em centavos para moeda brasileira
 */
export function formatCurrency(cents: number, locale = PRICING.LOCALE): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: PRICING.CURRENCY,
  }).format(cents / 100);
}

/**
 * Helper para obter o preço formatado do ticket
 */
export function getTicketPriceDisplay(): { card: string; pix: string } {
  return {
    card: formatCurrency(PRICING.TICKET.CARD),
    pix: formatCurrency(PRICING.TICKET.PIX),
  };
}

/**
 * Calcula economia do PIX sobre o cartão
 */
export function getPixSavings(): {
  amount: number;
  formatted: string;
  percentage: number;
} {
  const savings = PRICING.TICKET.CARD - PRICING.TICKET.PIX;
  return {
    amount: savings,
    formatted: formatCurrency(savings),
    percentage: Math.round((savings / PRICING.TICKET.CARD) * 100),
  };
}

export type Pricing = typeof PRICING;

export default PRICING;
