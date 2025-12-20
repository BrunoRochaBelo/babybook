/**
 * Credits Purchase Page
 *
 * Página para compra de pacotes de créditos (vouchers)
 * Integra com Stripe Checkout
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  CreditCard,
  QrCode,
  Check,
  Loader2,
  Star,
  AlertCircle,
} from "lucide-react";
import {
  getPartnerProfile,
  getPartnerDashboardStats,
  getCreditPackages,
  purchaseCredits,
} from "./api";
import type { CreditPackage, CreditPaymentMethod } from "./types";
import { usePartnerPageHeader } from "@/layouts/partnerPageHeader";
import { PartnerPage } from "@/layouts/PartnerPage";
import {
  PartnerLoadingState,
  PartnerErrorState,
} from "@/layouts/partnerStates";
import { PartnerBackButton } from "@/layouts/PartnerBackButton";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

const PIX_DISCOUNT_PER_VOUCHER_CENTS = 1400; // R$ 14 (docs: 149 -> 135 por voucher no lote 10)
const MAX_INSTALLMENTS_NO_INTEREST = 3;

function getPixPriceCents(pkg: CreditPackage): number {
  if (typeof pkg.pix_price_cents === "number") return pkg.pix_price_cents;
  return Math.max(
    0,
    pkg.price_cents - pkg.voucher_count * PIX_DISCOUNT_PER_VOUCHER_CENTS,
  );
}

function approxInstallmentCents(
  totalCents: number,
  installments: number,
): number {
  if (installments <= 0) return totalCents;
  return Math.round(totalCents / installments);
}

function centsPerVoucher(totalCents: number, voucherCount: number): number {
  return Math.round(totalCents / Math.max(1, voucherCount));
}

export function CreditsPage() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<CreditPaymentMethod>("pix");
  const [error, setError] = useState<string | null>(null);

  usePartnerPageHeader(
    useMemo(
      () => ({
        title: "Créditos",
        backTo: "/partner",
        backLabel: "Voltar ao portal",
      }),
      [],
    ),
  );

  // Queries
  const { data: profile } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: getPartnerProfile,
  });

  const { data: stats } = useQuery({
    queryKey: ["partner", "stats"],
    queryFn: getPartnerDashboardStats,
  });

  const {
    data: packages,
    isLoading: loadingPackages,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["partner", "credit-packages"],
    queryFn: getCreditPackages,
  });

  // Purchase mutation (precisa ficar antes de qualquer early-return)
  const purchaseMutation = useMutation({
    mutationFn: (input: { packageId: string; method: CreditPaymentMethod }) =>
      purchaseCredits(input.packageId, input.method),
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Erro ao processar compra");
    },
  });

  // Tratamento de erro de carregamento
  if (isError) {
    return (
      <PartnerErrorState
        title="Não foi possível carregar os pacotes"
        onRetry={refetch}
      />
    );
  }

  const handlePurchase = () => {
    if (!selectedPackage) return;
    setError(null);
    purchaseMutation.mutate({
      packageId: selectedPackage,
      method: paymentMethod,
    });
  };

  const selectedPkg = selectedPackage
    ? packages?.find((p) => p.id === selectedPackage)
    : undefined;

  const totals = selectedPkg
    ? {
        pix: getPixPriceCents(selectedPkg),
        card: selectedPkg.price_cents,
      }
    : null;

  const selectedTotalCents = totals
    ? paymentMethod === "pix"
      ? totals.pix
      : totals.card
    : 0;

  if (loadingPackages) {
    return <PartnerLoadingState label="Carregando pacotes…" />;
  }

  return (
    <PartnerPage>
      {/* Desktop Header */}
      <div className="hidden md:block mb-8">
        <PartnerBackButton to="/partner" label="Voltar ao portal" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Comprar Créditos
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400 mt-2">
          Escolha o pacote ideal para suas entregas
        </p>
      </div>

      {/* Mobile summary - botão voltar via header sticky */}
      <div className="md:hidden mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Comprar créditos para gerar vouchers e finalizar entregas.
        </p>
      </div>
      {/* Current Balance - Destaque especial */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-6 shadow-lg mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-pink-100 font-medium uppercase tracking-wide">
              Seus créditos
            </p>
            <p className="text-4xl font-bold text-white mt-1">
              {stats?.voucher_balance ?? profile?.voucher_balance ?? 0}{" "}
              <span className="text-2xl font-normal text-pink-100">
                disponíveis
              </span>
            </p>
            <p className="mt-2 text-sm text-pink-100">
              {stats?.reserved_credits ?? 0} reservados/em trânsito
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Package Selection */}
      <div className="space-y-4 mb-8 animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-100">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Selecione um pacote
        </h2>

        <div className="grid gap-4">
          {packages?.map((pkg) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              selected={selectedPackage === pkg.id}
              onSelect={() => setSelectedPackage(pkg.id)}
            />
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Purchase Button */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total a pagar
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedPkg ? formatCurrency(selectedTotalCents) : "-"}
            </p>
            {selectedPkg && totals && (
              <div className="mt-1 space-y-1">
                {paymentMethod === "pix" ? (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Economia vs cartão:{" "}
                    {formatCurrency(totals.card - totals.pix)}
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Até {MAX_INSTALLMENTS_NO_INTEREST}x de{" "}
                      {formatCurrency(
                        approxInstallmentCents(
                          totals.card,
                          MAX_INSTALLMENTS_NO_INTEREST,
                        ),
                      )}{" "}
                      sem juros
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      No PIX: {formatCurrency(totals.pix)} (economize{" "}
                      {formatCurrency(totals.card - totals.pix)})
                    </p>
                  </>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {paymentMethod === "pix"
                    ? "PIX é à vista."
                    : "Cartão: parcelas e juros (se houver) serão mostrados no checkout."}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handlePurchase}
            disabled={!selectedPackage || purchaseMutation.isPending}
            title={
              !selectedPackage ? "Selecione um pacote primeiro" : undefined
            }
            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {purchaseMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {paymentMethod === "pix" ? (
                  <QrCode className="w-5 h-5" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
                {paymentMethod === "pix" ? "Pagar via PIX" : "Pagar com cartão"}
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Você será redirecionado para o checkout para completar o pagamento de
          forma segura (PIX ou cartão).
        </p>
      </div>

      {/* Info Section */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
          ℹ️ Como funcionam os créditos?
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
          <li>
            • Ao gerar um voucher, <strong>1 crédito fica RESERVED</strong> (em
            trânsito)
          </li>
          <li>
            • No resgate: novo Baby Book → <strong>CONSUMED</strong>; bebê
            existente → <strong>REFUNDED</strong> (estorno automático)
          </li>
          <li>
            • O voucher é único por entrega e dá acesso às fotos daquele ensaio
          </li>
          <li>• Créditos não expiram</li>
        </ul>
      </div>
    </PartnerPage>
  );
}

// =============================================================================
// Package Card Component
// =============================================================================
interface PackageCardProps {
  package: CreditPackage;
  paymentMethod: CreditPaymentMethod;
  onPaymentMethodChange: (method: CreditPaymentMethod) => void;
  selected: boolean;
  onSelect: () => void;
}

function PackageCard({
  package: pkg,
  paymentMethod,
  onPaymentMethodChange,
  selected,
  onSelect,
}: PackageCardProps) {
  const pixTotal = getPixPriceCents(pkg);
  const cardTotal = pkg.price_cents;
  const activeTotal = paymentMethod === "pix" ? pixTotal : cardTotal;

  const savingsCents = cardTotal - pixTotal;
  const savingsPerVoucherCents = centsPerVoucher(
    savingsCents,
    pkg.voucher_count,
  );

  const activeUnit = centsPerVoucher(activeTotal, pkg.voucher_count);
  const pixUnit = centsPerVoucher(pixTotal, pkg.voucher_count);
  const cardUnit = centsPerVoucher(cardTotal, pkg.voucher_count);

  const otherMethod: CreditPaymentMethod =
    paymentMethod === "pix" ? "card" : "pix";
  const otherTotal = otherMethod === "pix" ? pixTotal : cardTotal;
  const otherUnit = otherMethod === "pix" ? pixUnit : cardUnit;

  const selectCard = () => {
    onSelect();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectCard();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={selectCard}
      onKeyDown={handleKeyDown}
      className={`w-full rounded-xl border-2 text-left transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-pink-300 dark:focus-visible:ring-pink-700 ${
        selected
          ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20 ring-2 ring-pink-200 dark:ring-pink-700 scale-[1.02] shadow-lg"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-300 dark:hover:border-pink-600 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
      }`}
    >
      <div
        className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${
          selected ? "p-6" : "p-5"
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`font-semibold text-gray-900 dark:text-white ${
                selected ? "text-lg" : "text-base"
              }`}
            >
              {pkg.name}
            </h3>
            {pkg.is_popular && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-500 text-white text-xs font-medium rounded-full">
                <Star className="w-3 h-3" />
                Mais Popular
              </span>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {pkg.voucher_count} vouchers
          </p>

          <div className="mt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {paymentMethod === "pix"
                ? "Total no PIX (à vista)"
                : `Total no cartão (até ${MAX_INSTALLMENTS_NO_INTEREST}x s/ juros)`}
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`font-bold text-gray-900 dark:text-white ${
                  selected ? "text-2xl" : "text-xl"
                }`}
              >
                {formatCurrency(activeTotal)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({formatCurrency(activeUnit)}/voucher)
              </span>
            </div>

            {/* Compact secondary line (shown for all cards) */}
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
              {paymentMethod === "pix" ? (
                <>
                  <span>
                    No cartão:{" "}
                    <span className="font-medium">
                      {formatCurrency(cardTotal)}
                    </span>
                  </span>
                  {savingsCents > 0 ? (
                    <span className="text-green-700 dark:text-green-300">
                      • economize {formatCurrency(savingsCents)}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <span className="text-gray-500 dark:text-gray-400">
                    Até {MAX_INSTALLMENTS_NO_INTEREST}x sem juros
                  </span>
                  <span>
                    • No PIX:{" "}
                    <span className="font-medium">
                      {formatCurrency(pixTotal)}
                    </span>
                  </span>
                  {savingsCents > 0 ? (
                    <span className="text-green-700 dark:text-green-300">
                      (economize {formatCurrency(savingsCents)})
                    </span>
                  ) : null}
                </>
              )}
            </div>

            {/* Expanded controls/details only for the selected card */}
            {selected && (
              <div className="mt-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Forma de pagamento
                  </p>
                  <div className="flex w-full sm:w-auto rounded-xl border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900/30">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPaymentMethodChange("pix");
                        onSelect();
                      }}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        paymentMethod === "pix"
                          ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      } flex-1 justify-center sm:flex-none sm:justify-start`}
                      aria-pressed={paymentMethod === "pix"}
                    >
                      <QrCode className="w-4 h-4" />
                      PIX
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPaymentMethodChange("card");
                        onSelect();
                      }}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        paymentMethod === "card"
                          ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      } flex-1 justify-center sm:flex-none sm:justify-start`}
                      aria-pressed={paymentMethod === "card"}
                    >
                      <CreditCard className="w-4 h-4" />
                      Cartão
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/20 p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Comparativo:{" "}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {otherMethod === "pix" ? "PIX" : "Cartão"}
                    </span>
                    {": "}
                    <span className="font-medium">
                      {formatCurrency(otherTotal)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {" "}
                      ({formatCurrency(otherUnit)}/voucher)
                    </span>
                    {otherMethod === "pix" && savingsCents > 0 ? (
                      <span className="text-green-700 dark:text-green-300">
                        {" "}
                        • economize {formatCurrency(savingsCents)} (
                        {formatCurrency(savingsPerVoucherCents)}/voucher)
                      </span>
                    ) : null}
                  </p>

                  {paymentMethod === "card" && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Até {MAX_INSTALLMENTS_NO_INTEREST}x de{" "}
                      {formatCurrency(
                        approxInstallmentCents(
                          cardTotal,
                          MAX_INSTALLMENTS_NO_INTEREST,
                        ),
                      )}{" "}
                      sem juros. Acima disso, juros e total aparecem no
                      checkout.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {pkg.savings_percent > 0 && (
            <p className="mt-3 text-xs text-green-700 dark:text-green-300 font-medium">
              Desconto por volume: {pkg.savings_percent}%
            </p>
          )}
        </div>

        <div
          className={`w-6 h-6 self-end sm:self-auto flex-shrink-0 rounded-full border-2 flex items-center justify-center ${
            selected
              ? "border-pink-500 bg-pink-500"
              : "border-gray-300 dark:border-gray-500"
          }`}
        >
          {selected && <Check className="w-4 h-4 text-white" />}
        </div>
      </div>
    </div>
  );
}

export default CreditsPage;
