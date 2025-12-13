/**
 * Credits Purchase Page
 *
 * Página para compra de pacotes de créditos (vouchers)
 * Integra com Stripe Checkout
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  CreditCard,
  Check,
  Loader2,
  ArrowLeft,
  Star,
  AlertCircle,
} from "lucide-react";
import { getPartnerProfile, getCreditPackages, purchaseCredits } from "./api";
import type { CreditPackage } from "./types";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function CreditsPage() {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Queries
  const { data: profile } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: getPartnerProfile,
  });

  const { data: packages, isLoading: loadingPackages } = useQuery({
    queryKey: ["partner", "credit-packages"],
    queryFn: getCreditPackages,
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: (packageId: string) => purchaseCredits(packageId),
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
    purchaseMutation.mutate(selectedPackage);
  };

  if (loadingPackages) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Comprar Créditos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Escolha o pacote ideal para suas entregas
          </p>
        </div>
        {/* Current Balance */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Seu saldo atual</p>
              <p className="text-3xl font-bold text-gray-900">
                {profile?.voucher_balance || 0} créditos
              </p>
            </div>
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-pink-600" />
            </div>
          </div>
        </div>

        {/* Package Selection */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Selecione um pacote
          </h2>

          <div className="grid gap-4">
            {packages?.map((pkg) => (
              <PackageCard
                key={pkg.id}
                package={pkg}
                selected={selectedPackage === pkg.id}
                onSelect={() => setSelectedPackage(pkg.id)}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Purchase Button */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Total a pagar</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedPackage
                  ? formatCurrency(
                      packages?.find((p) => p.id === selectedPackage)
                        ?.price_cents || 0,
                    )
                  : "-"}
              </p>
            </div>
            <button
              onClick={handlePurchase}
              disabled={!selectedPackage || purchaseMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pagar com Stripe
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Você será redirecionado para o Stripe para completar o pagamento de
            forma segura.
          </p>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">
            ℹ️ Como funcionam os créditos?
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Cada crédito permite criar 1 entrega para um cliente</li>
            <li>• Ao finalizar a entrega, um voucher único é gerado</li>
            <li>
              • O cliente resgata o voucher para criar sua conta Baby Book
            </li>
            <li>• Créditos não expiram</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// Package Card Component
// =============================================================================

interface PackageCardProps {
  package: CreditPackage;
  selected: boolean;
  onSelect: () => void;
}

function PackageCard({ package: pkg, selected, onSelect }: PackageCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
        selected
          ? "border-pink-500 bg-pink-50 ring-2 ring-pink-200"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
            {pkg.is_popular && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-500 text-white text-xs font-medium rounded-full">
                <Star className="w-3 h-3" />
                Mais Popular
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">{pkg.voucher_count} vouchers</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(pkg.price_cents)}
            </span>
            <span className="text-sm text-gray-500">
              ({formatCurrency(pkg.unit_price_cents)}/unidade)
            </span>
          </div>
          {pkg.savings_percent > 0 && (
            <p className="mt-1 text-sm text-green-600 font-medium">
              Economia de {pkg.savings_percent}%
            </p>
          )}
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            selected ? "border-pink-500 bg-pink-500" : "border-gray-300"
          }`}
        >
          {selected && <Check className="w-4 h-4 text-white" />}
        </div>
      </div>
    </button>
  );
}

export default CreditsPage;
