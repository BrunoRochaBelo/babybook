/**
 * Assinatura Page - B2C
 *
 * Página para visualização e gerenciamento de plano de assinatura.
 */

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Crown,
  Check,
  CreditCard,
  Calendar,
  Loader2,
} from "lucide-react";
import { getSubscription, settingsApiKeys } from "../api";
import { useTranslation } from "@babybook/i18n";
import { SettingsSubsectionSkeleton } from "../components/SettingsSubsectionSkeleton";

export const AssinaturaPage = () => {
  const { t } = useTranslation();

  // Busca dados da assinatura
  const { data, isLoading } = useQuery({
    queryKey: settingsApiKeys.subscription,
    queryFn: getSubscription,
    retry: 1,
    staleTime: 30000,
  });

  if (isLoading) {
    return <SettingsSubsectionSkeleton />;
  }

  // Valores default para fallback
  const planName = data?.plan_display_name ?? "Plano Família";
  const price = data?.price_cents ? (data.price_cents / 100).toFixed(2).replace(".", ",") : "29,90";
  const features = data?.features ?? [
    t("b2c.subscription.features.storage"),
    t("b2c.subscription.features.family"),
    t("b2c.subscription.features.backup"),
    t("b2c.subscription.features.capsule"),
    t("b2c.subscription.features.export"),
    t("b2c.subscription.features.support"),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/jornada"
          className="p-2 rounded-xl hover:bg-[var(--bb-color-bg)] transition-colors"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1
          className="text-2xl font-serif font-bold"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {t("b2c.subscription.title")}
        </h1>
      </div>

      {/* Current Plan */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          backgroundColor: "var(--bb-color-accent-light, rgba(0,0,0,0.03))",
          border: "2px solid var(--bb-color-accent)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Crown
            className="w-5 h-5"
            style={{ color: "var(--bb-color-accent)" }}
          />
          <span
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: "var(--bb-color-accent)" }}
          >
            {t("b2c.subscription.currentPlan")}
          </span>
        </div>
        <h3
          className="text-2xl font-serif font-bold mb-1"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : planName}
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <CreditCard
              className="w-4 h-4"
              style={{ color: "var(--bb-color-ink-muted)" }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "var(--bb-color-ink)" }}
            >
              {t("b2c.subscription.pricePerMonth", { price })}
            </p>
          </div>
          <span style={{ color: "var(--bb-color-ink-muted)" }}>•</span>
          <div className="flex items-center gap-2">
            <Calendar
              className="w-4 h-4"
              style={{ color: "var(--bb-color-ink-muted)" }}
            />
            <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
              {t("b2c.subscription.renewalOn", { date: "15 de Fevereiro" })}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 rounded-xl font-medium border transition-colors hover:bg-[var(--bb-color-bg)]"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              borderColor: "var(--bb-color-border)",
              color: "var(--bb-color-ink)",
            }}
          >
            {t("b2c.subscription.changePlan")}
          </button>
          <button
            className="px-4 py-2 font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--bb-color-danger, #ef4444)" }}
          >
            {t("b2c.subscription.cancel")}
          </button>
        </div>
      </div>

      {/* Features */}
      <div
        className="rounded-2xl p-4 mb-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <h4
          className="font-semibold mb-4"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {t("b2c.subscription.included")}
        </h4>
        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li
              key={i}
              className="flex items-center gap-3"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--bb-color-accent-light, rgba(0,0,0,0.05))" }}
              >
                <Check
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--bb-color-accent)" }}
                />
              </div>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Payment Info */}
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: "var(--bb-color-bg)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <h4
          className="font-semibold mb-2"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {t("b2c.subscription.paymentMethod")}
        </h4>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-8 rounded flex items-center justify-center"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              border: "1px solid var(--bb-color-border)",
            }}
          >
            <CreditCard
              className="w-5 h-5"
              style={{ color: "var(--bb-color-ink-muted)" }}
            />
          </div>
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--bb-color-ink)" }}
            >
              •••• •••• •••• 4242
            </p>
            <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>
              {t("b2c.subscription.cardEnding", { expiry: "12/2025" })}
            </p>
          </div>
        </div>
        <button
          className="mt-3 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--bb-color-accent)" }}
        >
          {t("b2c.subscription.updatePayment")}
        </button>
      </div>
    </div>
  );
};
