/**
 * Credits Purchase Page
 *
 * Página para compra de pacotes de créditos (vouchers)
 * Integra com Stripe Checkout
 */

import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  CreditCard,
  QrCode,
  Check,
  Loader2,
  Star,
  AlertCircle,
  Info,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Zap,
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
import { PartnerErrorState } from "@/layouts/partnerStates";
import { CreditsSkeleton } from "./components/CreditsSkeleton";
import { PartnerBackButton } from "@/layouts/PartnerBackButton";
import { useTranslation, useLanguage } from "@babybook/i18n";

function formatCurrencyBase(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
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
  const { t } = useTranslation();
  const { language } = useLanguage();
  const formatCurrency = useCallback(
    (cents: number) => formatCurrencyBase(cents, language),
    [language],
  );
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<CreditPaymentMethod>("pix");
  const [error, setError] = useState<string | null>(null);

  usePartnerPageHeader(
    useMemo(
      () => ({
        title: t("partner.credits.title"),
      }),
      [t],
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

  // Tratamento de erro de carregamento
  if (isError) {
    return (
      <PartnerErrorState
        title="Não foi possível carregar os pacotes"
        onRetry={refetch}
        skeleton={<CreditsSkeleton />}
      />
    );
  }

  if (loadingPackages) {
    return <CreditsSkeleton />;
  }

  return (
    <PartnerPage>
      <div className="pb-60 lg:pb-12">
        {/* Header Section */}
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t("partner.credits.purchase.buyCredits")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
            {t("partner.credits.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Wallet & Packages */}
          <div className="lg:col-span-2 space-y-8">
            {/* New Wallet Card Design */}
            <WalletCard
              available={stats?.voucher_balance ?? profile?.voucher_balance ?? 0}
              reserved={stats?.reserved_credits ?? 0}
            />
            


            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Package Selection */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                {t("partner.credits.purchase.selectPackage")}
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

            {/* Info Section (Moved from bottom) */}
            {/* Info Section (Refined) */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-[1.5rem] border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-6">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Info className="w-5 h-5" />
                </div>
                {t("partner.credits.purchase.howItWorks")}
              </h3>
              <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t("partner.credits.purchase.info.reserved").replace(
                        "RESERVED",
                        '<strong class="text-gray-900 dark:text-white font-medium">RESERVED</strong>',
                      ),
                    }}
                  />
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t("partner.credits.purchase.info.consumed")
                        .replace("CONSUMED", '<strong class="text-gray-900 dark:text-white font-medium">CONSUMED</strong>')
                        .replace("REFUNDED", '<strong class="text-gray-900 dark:text-white font-medium">REFUNDED</strong>'),
                    }}
                  />
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                  {t("partner.credits.purchase.info.unique")}
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                  {t("partner.credits.purchase.info.expiration")}
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Order Summary (Sticky) */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24">
            <OrderSummaryCard
              selectedPkg={selectedPkg}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              totalCents={selectedTotalCents}
              totals={totals}
              onPurchase={handlePurchase}
              isProcessing={purchaseMutation.isPending}
              formatCurrency={formatCurrency}
            />
          </div>
        </div>

        {/* Mobile Fixed Order Summary */}
        <div className="lg:hidden fixed bottom-24 left-4 right-4 z-40 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedPkg ? formatCurrency(selectedTotalCents) : "R$ --"}
                </p>
                {selectedPkg && totals && paymentMethod === "pix" && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {t("partner.credits.purchase.savingsVsCard", {
                      value: formatCurrency(totals.card - totals.pix),
                    })}
                  </p>
                )}
              </div>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setPaymentMethod("pix")}
                  className={`p-2 rounded-md transition-all ${
                    paymentMethod === "pix"
                      ? "bg-white dark:bg-gray-700 shadow-sm text-pink-600 dark:text-pink-400"
                      : "text-gray-400"
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`p-2 rounded-md transition-all ${
                    paymentMethod === "card"
                      ? "bg-white dark:bg-gray-700 shadow-sm text-pink-600 dark:text-pink-400"
                      : "text-gray-400"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button
              onClick={handlePurchase}
              disabled={!selectedPackage || purchaseMutation.isPending}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-white shadow-lg transition-all active:scale-[0.98] ${
                selectedPackage
                  ? "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-pink-500/25"
                  : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
              }`}
            >
              {purchaseMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {t("partner.credits.purchase.buyCredits")}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PartnerPage>
  );
}

// =============================================================================
// Wallet Card Component
// =============================================================================
function WalletCard({
  available,
  reserved,
}: {
  available: number;
  reserved: number;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20 border border-white/50 dark:border-gray-700/50">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400">
            <Wallet className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              {t("partner.credits.title")}
            </span>
          </div>

          <div className="flex items-end gap-3">
            <div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                {available}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t("partner.credits.ready", { count: available })}
              </p>
            </div>
            {available <= 2 && (
              <div className="mb-2 px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full">
                <p className="text-xs font-semibold text-pink-600 dark:text-pink-400">
                  Saldo acabando
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Divider for mobile */}
        <div className="h-px w-full bg-gray-200 dark:bg-gray-800 md:hidden" />

        <div className="flex gap-6">
          <div className="md:border-l md:border-gray-200 dark:md:border-gray-800 md:pl-6">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
              <span className="text-xs font-medium uppercase">
                {t("partner.credits.reserved")}
              </span>
              <Info className="w-3.5 h-3.5" />
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{reserved}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("partner.credits.waitingRedemption")}
            </p>
          </div>

          {/* Desktop Link */}
          <div className="hidden md:flex flex-col justify-center items-end md:border-l md:border-gray-200 dark:md:border-gray-800 md:pl-6">
            <Link 
              to="/partner/credits/extract"
              className="group flex flex-col items-end"
            >
              <span className="text-xs font-semibold text-pink-600 dark:text-pink-400 group-hover:text-pink-700 dark:group-hover:text-pink-300 flex items-center gap-1 transition-colors">
                Ver extrato <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <span className="text-[10px] text-gray-400 mt-1">
                Histórico completo
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile Link */}
        <div className="md:hidden mt-2 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-center">
            <Link 
              to="/partner/credits/extract"
              className="text-sm font-medium text-pink-600 dark:text-pink-400 flex items-center gap-1"
            >
              Ver extrato completo <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Order Summary Card (Desktop Sticky)
// =============================================================================
function OrderSummaryCard({
  selectedPkg,
  paymentMethod,
  setPaymentMethod,
  totalCents,
  totals,
  onPurchase,
  isProcessing,
  formatCurrency,
}: {
  selectedPkg: CreditPackage | undefined;
  paymentMethod: CreditPaymentMethod;
  setPaymentMethod: (m: CreditPaymentMethod) => void;
  totalCents: number;
  totals: { pix: number; card: number } | null;
  onPurchase: () => void;
  isProcessing: boolean;
  formatCurrency: (v: number) => string;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20 border border-white/50 dark:border-gray-700/50 p-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        {t("partner.credits.purchase.orderSummary")}
      </h3>

      {/* Payment Method Selector */}
      {/* Payment Method Selector */}
      <div className="bg-gray-100 dark:bg-gray-900/50 p-1.5 rounded-2xl mb-6 flex">
        <button
          onClick={() => setPaymentMethod("pix")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            paymentMethod === "pix"
              ? "bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <QrCode className="w-4 h-4" />
          PIX
        </button>
        <button
          onClick={() => setPaymentMethod("card")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            paymentMethod === "card"
              ? "bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Cartão
        </button>
      </div>

      {/* Selected Item */}
      <div className="mb-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Pacote</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {selectedPkg ? selectedPkg.name : "--"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Qtd. Vouchers</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {selectedPkg ? selectedPkg.voucher_count : "--"}
          </span>
        </div>
        <div className="h-px bg-gray-100 dark:bg-gray-700 my-3" />
        <div className="flex justify-between items-baseline">
          <span className="text-base font-semibold text-gray-900 dark:text-white">
            Total
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedPkg ? formatCurrency(totalCents) : "R$ --"}
          </span>
        </div>
        
        {/* Savings / Installments Info */}
        {selectedPkg && totals && (
          <div className="text-right">
            {paymentMethod === "pix" ? (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center justify-end gap-1">
                <ShieldCheck className="w-3 h-3" />
                Economia de {formatCurrency(totals.card - totals.pix)}
              </span>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Até {MAX_INSTALLMENTS_NO_INTEREST}x de{" "}
                {formatCurrency(
                  approxInstallmentCents(totals.card, MAX_INSTALLMENTS_NO_INTEREST)
                )}
              </span>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onPurchase}
        disabled={!selectedPkg || isProcessing}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white shadow-lg transition-all active:scale-[0.95] ${
          selectedPkg
            ? "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-pink-500/25"
            : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
        }`}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {t("partner.credits.purchase.continue")}
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
        <ShieldCheck className="w-3 h-3" />
        {t("partner.credits.purchase.secureCheckout")}
      </p>
    </div>
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
  selected,
  onSelect,
}: PackageCardProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const formatCurrency = useCallback(
    (cents: number) => formatCurrencyBase(cents, language),
    [language],
  );
  const pixTotal = getPixPriceCents(pkg);
  const cardTotal = pkg.price_cents;
  const activeTotal = paymentMethod === "pix" ? pixTotal : cardTotal;
  const activeUnit = centsPerVoucher(activeTotal, pkg.voucher_count);

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
      className={`relative w-full rounded-2xl border transition-all duration-300 cursor-pointer outline-none group ${
        selected
          ? "border-pink-500 bg-pink-50/30 dark:bg-pink-900/10 shadow-lg shadow-pink-500/10 ring-1 ring-pink-500"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md"
      }`}
    >
      {pkg.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          {t("partner.credits.purchase.mostPopular")}
        </div>
      )}

      <div className="p-5 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <h3
              className={`font-bold text-gray-900 dark:text-white ${
                selected ? "text-lg" : "text-base"
              }`}
            >
              {pkg.name}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              • {pkg.voucher_count} vouchers
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {formatCurrency(activeTotal)}
            </span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {formatCurrency(activeUnit)} / voucher
            </span>
          </div>

          {pkg.savings_percent > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
              {t("partner.credits.purchase.volumeDiscount", {
                value: pkg.savings_percent,
              })}
            </p>
          )}
        </div>

        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            selected
              ? "border-pink-500 bg-pink-500"
              : "border-gray-300 dark:border-gray-600 group-hover:border-pink-400"
          }`}
        >
          {selected && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
      </div>
    </div>
  );
}

export default CreditsPage;
