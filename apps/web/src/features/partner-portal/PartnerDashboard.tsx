/**
 * Partner Portal Dashboard
 *
 * Dashboard principal para fotógrafos gerenciarem:
 * - Saldo de créditos (voucher_balance)
 * - Compra de créditos
 * - Entregas e vouchers
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Package,
  Ticket,
  Plus,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Gift,
  Image,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Info,
} from "lucide-react";
import { useTranslation, useLanguage } from "@babybook/i18n";
import {
  getPartnerProfile,
  getPartnerDashboardStats,
  listDeliveries,
} from "./api";
import {
  getPartnerDeliveryStatusMeta,
  normalizePartnerDeliveryStatus,
} from "./deliveryStatus";
import { CreditStatusBadge } from "./creditStatus";
import {
  PLACEHOLDER_NOT_GENERATED,
  PLACEHOLDER_NOT_INFORMED,
} from "./placeholders";
import {
  PartnerPageHeaderAction,
  usePartnerPageHeader,
} from "@/layouts/partnerPageHeader";
import { PartnerPage } from "@/layouts/PartnerPage";
import { StatCard } from "@/layouts/StatCard";
import { PartnerErrorState } from "@/layouts/partnerStates";
import { PartnerOnboarding } from "./PartnerOnboarding";
import { PartnerDetailedStats } from "./PartnerDetailedStats";
import { GuidedTour } from "@/components/GuidedTour";

function formatDate(dateString: string, locale: string): string {
  try {
    return new Date(dateString).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Retorna saudação baseada no horário atual
 */
function getGreeting(t: (key: string, options?: any) => string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return t("partner.dashboard.welcomeMorning");
  if (hour >= 12 && hour < 18) return t("partner.dashboard.welcomeAfternoon");
  return t("partner.dashboard.welcomeEvening");
}

/**
 * Retorna uma dica contextual baseada no estado do usuário
 */
function getContextualTip(
  options: {
    hasLowCredits: boolean;
    hasReadyDeliveries: boolean;
    hasPendingUpload: boolean;
    deliveriesCount: number;
    redeemedCount: number;
  },
  t: (key: string, options?: any) => string,
): { icon: typeof Lightbulb; text: string; color: string } | null {
  const {
    hasLowCredits,
    hasReadyDeliveries,
    hasPendingUpload,
    deliveriesCount,
    redeemedCount,
  } = options;

  // Prioridade: ações pendentes primeiro
  if (hasPendingUpload) {
    return {
      icon: Clock,
      text: t("partner.dashboard.tips.pendingUpload"),
      color: "text-yellow-600 dark:text-yellow-400",
    };
  }

  if (hasReadyDeliveries) {
    return {
      icon: Gift,
      text: t("partner.dashboard.tips.readyDeliveries"),
      color: "text-green-600 dark:text-green-400",
    };
  }

  if (hasLowCredits) {
    return {
      icon: CreditCard,
      text: t("partner.dashboard.tips.lowCredits"),
      color: "text-pink-600 dark:text-pink-400",
    };
  }

  // Dicas motivacionais baseadas em progresso
  if (redeemedCount > 0 && deliveriesCount >= 5) {
    return {
      icon: TrendingUp,
      text: t("partner.dashboard.tips.growth", { count: redeemedCount }),
      color: "text-purple-600 dark:text-purple-400",
    };
  }

  if (deliveriesCount === 0) {
    return {
      icon: Sparkles,
      text: t("partner.dashboard.tips.firstDelivery"),
      color: "text-pink-600 dark:text-pink-400",
    };
  }

  return null;
}

function DeliveryStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config: Record<string, { icon: typeof Clock; className: string }> = {
    draft: {
      icon: Clock,
      className:
        "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    },
    pending_upload: {
      icon: Clock,
      className:
        "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300",
    },
    processing: {
      icon: Loader2,
      className:
        "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
    },
    ready: {
      icon: CheckCircle2,
      className:
        "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
    },
    delivered: {
      icon: Gift,
      className:
        "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
    },
    failed: {
      icon: AlertCircle,
      className: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    },
    archived: {
      icon: Package,
      className:
        "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
    },
  };

  const normalized = normalizePartnerDeliveryStatus(status);
  const cfg = config[normalized] || config.draft;
  const Icon = cfg.icon;
  // TODO: Use translation for status labels
  const meta = getPartnerDeliveryStatusMeta(normalized);

  return (
    <span
      title={t(meta.hint)}
      aria-label={`${t(meta.label)}. ${t(meta.hint)}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}
    >
      <Icon className="w-3 h-3" />
      {/* Fallback to meta label if translation key structure doesn't match */}
      {t(`partner.deliveries.status.${normalized}`, {
        defaultValue: t(meta.shortLabel),
      })}
    </span>
  );
}

export function PartnerDashboard() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  // const t = (k: string) => k;
  // const language = "pt-BR";

  // Queries
  const {
    data: profile,
    isLoading: loadingProfile,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: getPartnerProfile,
  });

  const {
    data: stats,
    isLoading: loadingStats,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["partner", "stats"],
    queryFn: getPartnerDashboardStats,
  });

  const {
    data: recentDeliveriesData,
    isLoading: loadingRecentDeliveries,
    isError: isRecentDeliveriesError,
    error: recentDeliveriesError,
    refetch: refetchRecentDeliveries,
  } = useQuery({
    queryKey: ["partner", "deliveries", "recent"],
    queryFn: () =>
      listDeliveries({ limit: 5, include_archived: false, sort: "newest" }),
  });

  // Ações pendentes (ex.: upload). Não podemos depender só das 5 mais recentes.
  const {
    data: needsActionData,
    isLoading: loadingNeedsAction,
    isError: isNeedsActionError,
    error: needsActionError,
    refetch: refetchNeedsAction,
  } = useQuery({
    queryKey: ["partner", "deliveries", "needs_action"],
    queryFn: () =>
      listDeliveries({
        view: "needs_action",
        limit: 20,
        include_archived: false,
      }),
    staleTime: 15_000,
  });

  const insightsEnabled = (stats?.total_deliveries ?? 0) >= 5;
  const {
    data: insightsDeliveriesData,
    isLoading: loadingInsights,
    isError: isInsightsError,
    error: insightsError,
    refetch: refetchInsights,
  } = useQuery({
    queryKey: ["partner", "deliveries", "insights", "last_90"],
    enabled: insightsEnabled,
    queryFn: () =>
      listDeliveries({
        created: "last_90",
        limit: 200,
        include_archived: false,
        sort: "newest",
      }),
  });

  const isLoading =
    loadingProfile ||
    loadingStats ||
    loadingRecentDeliveries ||
    loadingNeedsAction;

  usePartnerPageHeader(
    useMemo(
      () => ({
        title: t("partner.dashboard.title"),
        actions: (
          <PartnerPageHeaderAction
            to="/partner/deliveries/new"
            label={t("partner.deliveries.newDelivery")}
            tone="primary"
            icon={<Plus className="w-4 h-4" />}
          />
        ),
      }),
      [t],
    ),
  );

  const handleRetry = () => {
    refetchProfile();
    refetchStats();
    refetchRecentDeliveries();
    refetchNeedsAction();
    refetchInsights();
  };

  const isError =
    isProfileError ||
    isStatsError ||
    isRecentDeliveriesError ||
    isNeedsActionError ||
    isInsightsError;
  const errorMessage =
    (profileError instanceof Error && profileError.message) ||
    (statsError instanceof Error && statsError.message) ||
    (recentDeliveriesError instanceof Error && recentDeliveriesError.message) ||
    (needsActionError instanceof Error && needsActionError.message) ||
    (insightsError instanceof Error && insightsError.message) ||
    null;

  const deliveries = recentDeliveriesData?.deliveries ?? [];
  const availableCredits = stats?.voucher_balance ?? 0;
  const reservedCredits = stats?.reserved_credits ?? 0;
  const hasLowCredits = availableCredits <= 2;
  const needsActionDeliveries = needsActionData?.deliveries ?? [];
  const pendingUpload =
    needsActionDeliveries.find(
      (d) => normalizePartnerDeliveryStatus(d.status) === "pending_upload",
    ) ??
    deliveries.find(
      (d) => normalizePartnerDeliveryStatus(d.status) === "pending_upload",
    );
  const readyDeliveries = stats?.ready_deliveries ?? 0;

  // Dica contextual para o usuário (hooks precisam ser chamados antes de early-return)
  const contextualTip = useMemo(() => {
    if (isError) return null;
    return getContextualTip(
      {
        hasLowCredits,
        hasReadyDeliveries: readyDeliveries > 0,
        hasPendingUpload: Boolean(pendingUpload),
        deliveriesCount: stats?.total_deliveries ?? 0,
        redeemedCount: stats?.redeemed_vouchers ?? 0,
      },
      t,
    );
  }, [
    isError,
    hasLowCredits,
    readyDeliveries,
    pendingUpload,
    stats?.total_deliveries,
    stats?.redeemed_vouchers,
    t,
  ]);

  // Dados para o onboarding
  const onboardingStats = useMemo(
    () => ({
      hasCompletedProfile: Boolean(profile?.studio_name),
      hasCredits: availableCredits > 0 || reservedCredits > 0,
      hasDeliveries: deliveries.length > 0,
      hasFiveDeliveries: (stats?.total_deliveries ?? 0) >= 5,
    }),
    [
      profile?.studio_name,
      availableCredits,
      reservedCredits,
      deliveries.length,
      stats?.total_deliveries,
    ],
  );

  if (isLoading) {
    return (
      <PartnerPage>
        <div className="animate-pulse space-y-4">
          <div className="hidden md:block">
            <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-64 bg-gray-200/80 dark:bg-gray-700/80 rounded mt-2" />
          </div>

          <div className="rounded-2xl p-6 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700" />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 mb-3" />
                <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-24 bg-gray-200/80 dark:bg-gray-700/80 rounded mt-2" />
                <div className="h-3 w-28 bg-gray-200/60 dark:bg-gray-700/60 rounded mt-2" />
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-4 w-44 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-64 bg-gray-200/70 dark:bg-gray-700/70 rounded mt-2" />
                  </div>
                  <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full hidden sm:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PartnerPage>
    );
  }

  if (isError) {
    return (
      <PartnerErrorState
        variant="page"
        errorDetails={errorMessage}
        onRetry={handleRetry}
        secondaryAction={{
          label: t("partner.dashboard.viewAllDeliveries"),
          to: "/partner/deliveries",
          icon: Package,
        }}
      />
    );
  }

  return (
    <PartnerPage>
      {/* Page Header (desktop) */}
      <div
        data-tour="dashboard-header"
        className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8"
      >
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {getGreeting(t)},{" "}
            {profile?.studio_name || profile?.name || t("common.name")}!
          </h1>
          {contextualTip ? (
            <div
              className={`flex items-center gap-2 mt-2 ${contextualTip.color}`}
            >
              <contextualTip.icon className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{contextualTip.text}</p>
            </div>
          ) : (
            <p className="text-base text-gray-500 dark:text-gray-400 mt-2">
              {t("partner.dashboard.welcomeNewUser")}
            </p>
          )}
        </div>
        <Link
          to="/partner/deliveries/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-500 text-white rounded-xl hover:bg-pink-600 active:scale-[0.98] transition-all font-medium shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">
            {t("partner.deliveries.newDelivery")}
          </span>
          <span className="sm:hidden">{t("common.actions")}</span>
        </Link>
      </div>

      {/* Mobile intro (mantém contexto sem duplicar o header) */}
      <div className="md:hidden mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {getGreeting(t)},{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {profile?.studio_name || profile?.name || t("common.name")}
          </span>
          ! 👋
        </p>
        {contextualTip && (
          <div
            className={`flex items-center gap-2 mt-2 ${contextualTip.color}`}
          >
            <contextualTip.icon className="w-3.5 h-3.5 flex-shrink-0" />
            <p className="text-xs">{contextualTip.text}</p>
          </div>
        )}
      </div>

      {/* Onboarding - Primeiros Passos */}
      <PartnerOnboarding stats={onboardingStats} />

      {/* Credit Balance Card - Destaque principal */}
      <div
        data-tour="credits-card"
        className="mb-6 sm:mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      >
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-pink-100 text-xs sm:text-sm font-medium uppercase tracking-wide">
                  {t("partner.credits.title")}
                </p>
                {hasLowCredits ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white border border-white/20">
                    {t("partner.dashboard.tips.lowCredits")}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/15 border border-white/20 px-3 py-2 group">
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] uppercase tracking-wide text-pink-100">
                      {t("partner.credits.available")}
                    </p>
                    <span
                      className="opacity-60 group-hover:opacity-100 transition-opacity cursor-help"
                      title={t("partner.credits.availableTooltip")}
                    >
                      <Info className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-2xl font-bold leading-tight">
                    {availableCredits}
                  </p>
                  <p className="text-[11px] text-pink-100">
                    {availableCredits === 1
                      ? "crédito pronto"
                      : "créditos prontos"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/15 border border-white/20 px-3 py-2 group">
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] uppercase tracking-wide text-pink-100">
                      {t("partner.credits.reserved")}
                    </p>
                    <span
                      className="opacity-60 group-hover:opacity-100 transition-opacity cursor-help"
                      title={t("partner.credits.reservedTooltip")}
                    >
                      <Info className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-2xl font-bold leading-tight">
                    {reservedCredits}
                  </p>
                  <p className="text-[11px] text-pink-100">
                    aguardando resgate
                  </p>
                </div>
              </div>
              <p className="text-pink-100/80 text-xs mt-3 hidden sm:flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                {t("partner.dashboard.tips.creditsInfo")}
              </p>
            </div>
            <Link
              to="/partner/credits"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white text-pink-600 rounded-xl hover:bg-pink-50 active:scale-[0.98] transition-all font-semibold shadow-sm"
            >
              <CreditCard className="w-5 h-5" />
              <span className="hidden sm:inline">
                {t("partner.credits.purchase.buyCredits")}
              </span>
              <span className="sm:hidden">
                {t("partner.credits.purchase.buyCredits")}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Alertas Contextuais (só aparecem quando há algo relevante) */}
      {(pendingUpload || (stats?.ready_deliveries || 0) > 0 || hasLowCredits) && (
        <div className="mb-6 sm:mb-8 flex flex-wrap gap-3">
          {pendingUpload && (
            <Link
              to={`/partner/deliveries/${pendingUpload.id}/upload`}
              className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-800/50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {t("partner.dashboard.tips.pendingUpload")}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300 truncate">
                  {pendingUpload.title || pendingUpload.client_name || "Entrega"}{" "}
                  wait
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            </Link>
          )}

          {(stats?.ready_deliveries || 0) > 0 && (
            <Link
              to="/partner/deliveries?status=ready"
              className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/30 hover:shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-800/50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {stats?.ready_deliveries}{" "}
                  {stats?.ready_deliveries === 1
                    ? t("partner.dashboard.tips.readyDeliveries")
                    : t("partner.dashboard.tips.readyDeliveries")}
                </p>
                <p className="text-xs text-green-600 dark:text-green-300">
                  Link/voucher
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            </Link>
          )}

          {hasLowCredits && (
            <Link
              to="/partner/credits"
              className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800/50 hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-800/50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-pink-800 dark:text-pink-200">
                  {t("partner.dashboard.tips.lowCredits")}
                </p>
                <p className="text-xs text-pink-600 dark:text-pink-300">
                  {t("partner.credits.balance")}: {availableCredits}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
            </Link>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div
        data-tour="stats-grid"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <StatCard
          icon={Package}
          label={t("partner.dashboard.stats.totalDeliveries")}
          value={stats?.total_deliveries || 0}
          color="blue"
          to="/partner/deliveries"
          description={t("partner.dashboard.viewAllDeliveries")}
        />
        <StatCard
          icon={CheckCircle2}
          label={t("partner.deliveries.status.ready")}
          value={readyDeliveries}
          color="green"
          to="/partner/deliveries?status=ready"
          description={
            readyDeliveries > 0 ? "Link/voucher →" : t("common.none")
          }
        />
        <StatCard
          icon={Ticket}
          label={t("partner.dashboard.stats.pendingDeliveries")}
          value={stats?.pending_vouchers || 0}
          color="purple"
          to="/partner/deliveries?voucher=with&redeemed=not_redeemed"
          description="Aguardando resgate"
        />
        <StatCard
          icon={Gift}
          label={t("partner.dashboard.stats.completedDeliveries")}
          value={stats?.delivered_deliveries || 0}
          color="pink"
          to="/partner/deliveries?status=delivered"
          description={t("partner.deliveries.status.delivered")}
        />
      </div>

      {/* Estatísticas Detalhadas - só aparece com 5+ entregas */}
      <PartnerDetailedStats
        totalDeliveries={stats?.total_deliveries || 0}
        totalVouchers={stats?.total_vouchers || 0}
        redeemedVouchers={stats?.redeemed_vouchers || 0}
        deliveries={insightsDeliveriesData?.deliveries ?? deliveries}
        isLoading={insightsEnabled && loadingInsights}
      />

      {/* Recent Deliveries */}
      <div
        data-tour="recent-deliveries"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("partner.dashboard.recentDeliveries")}
          </h2>
          <Link
            to="/partner/deliveries"
            className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 font-medium inline-flex items-center gap-1"
          >
            {t("common.all")}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {deliveries.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-pink-500 dark:text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("partner.dashboard.startFirstDelivery")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              {t("partner.deliveries.list.emptyDescription")}
            </p>
            <Link
              to="/partner/deliveries/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white rounded-xl hover:bg-pink-600 active:scale-[0.98] transition-all font-medium shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              {t("partner.deliveries.newDelivery")}
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="lg:hidden grid gap-3 p-1">
              {deliveries.map((delivery) => {
                const normalizedStatus = normalizePartnerDeliveryStatus(
                  delivery.status,
                );
                const voucherMissingTitle =
                  normalizedStatus === "ready"
                    ? "Entrega pronta. Gere o voucher nos detalhes."
                    : "O voucher aparece após a entrega ficar pronta.";

                return (
                  <Link
                    key={delivery.id}
                    to={`/partner/deliveries/${delivery.id}`}
                    className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all"
                    aria-label={`Abrir detalhes da entrega ${delivery.title || delivery.client_name || "sem título"}`}
                  >
                    {/* Main Content */}
                    <div className="p-4">
                      {/* Row 1: Icon + Title/Client + Status Badge */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-11 h-11 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Image className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white text-base leading-tight line-clamp-2">
                                {delivery.title ||
                                  delivery.client_name ||
                                  t("common.none")}
                              </h3>
                              {delivery.client_name && delivery.title && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                  {delivery.client_name}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              <DeliveryStatusBadge status={delivery.status} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Date + Voucher Code */}
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatDate(delivery.created_at, language)}
                        </span>
                        {delivery.voucher_code ? (
                          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-md">
                            {delivery.voucher_code}
                          </span>
                        ) : (
                          <span
                            className="text-xs text-gray-400 dark:text-gray-500 italic"
                            title={voucherMissingTitle}
                          >
                            {PLACEHOLDER_NOT_GENERATED}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 3: Credit Badge + Action */}
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                      <CreditStatusBadge status={delivery.credit_status} />

                      <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium transition-colors">
                        {t("common.details")}
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-medium">
                  <tr>
                    <th className="px-6 py-4 text-left tracking-wider">
                      {t("partner.deliveries.create.step1")}
                    </th>
                    <th className="px-6 py-4 text-left tracking-wider">
                      {t("partner.deliveries.create.recipientName")}
                    </th>
                    <th className="px-6 py-4 text-left tracking-wider">
                      {t("partner.deliveries.status.all")}
                    </th>
                    <th className="px-6 py-4 text-left tracking-wider">
                      {t("common.date")}
                    </th>
                    <th className="px-6 py-4 text-right tracking-wider">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {deliveries.map((delivery) => (
                    <tr
                      key={delivery.id}
                      className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                            <Image className="w-5 h-5" />
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {delivery.title ||
                              delivery.client_name ||
                              t("common.none")}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {delivery.client_name || PLACEHOLDER_NOT_INFORMED}
                      </td>
                      <td className="px-6 py-4">
                        <DeliveryStatusBadge status={delivery.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(delivery.created_at, language)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/partner/deliveries/${delivery.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 transition-colors"
                        >
                          {t("common.details")}
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </PartnerPage>
  );
}

export default PartnerDashboard;
