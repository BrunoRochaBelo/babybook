/**
 * Partner Portal Dashboard
 *
 * Dashboard principal para fotógrafos gerenciarem:
 * - Saldo de créditos (voucher_balance)
 * - Compra de créditos
 * - Entregas e vouchers
 */

import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Package,
  Ticket,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Gift,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Info,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "@babybook/i18n";
import {
  getPartnerProfile,
  getPartnerDashboardStats,
  listDeliveries,
} from "./api";
import { normalizePartnerDeliveryStatus } from "./deliveryStatus";
import {
  PartnerPageHeaderAction,
  usePartnerPageHeader,
} from "@/layouts/partnerPageHeader";
import { PartnerPage } from "@/layouts/PartnerPage";
import { StatCard } from "@/layouts/StatCard";
import { PartnerErrorState } from "@/layouts/partnerStates";
import { PartnerOnboarding } from "./PartnerOnboarding";
import { PartnerDetailedStats } from "./PartnerDetailedStats";
import {
  GuidedTour,
  PARTNER_TOUR_STEPS,
  TOUR_COMPLETED_KEY_B2B,
} from "@/components/GuidedTour";

type TFn = (key: string, options?: Record<string, unknown>) => string;

/**
 * Retorna saudação baseada no horário atual
 */
function getGreeting(t: TFn): string {
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
  t: TFn,
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
      color: "text-amber-600 dark:text-amber-400",
    };
  }

  if (hasReadyDeliveries) {
    return {
      icon: Gift,
      text: t("partner.dashboard.tips.readyDeliveries"),
      color: "text-emerald-600 dark:text-emerald-400",
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

// DeliveryStatusBadge removed - using shared StatusBadge from table/card components
import { DeliveryCardMobile } from "./components/DeliveryCardMobile";
import { DeliveryTableRow, DELIVERY_GRID_COLS } from "./components/DeliveryTableRow";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { cn } from "@/lib/utils";

export function PartnerDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        title: "", // Custom rendered in page
        actions: null,
      }),
      [],
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
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <PartnerErrorState
        variant="page"
        errorDetails={errorMessage}
        onRetry={handleRetry}
        skeleton={<DashboardSkeleton />}
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
      {/* 
        PREMIUM HEADER SECTION
        Includes Greetings + Contextual action button
      */}
      <div
        data-tour="dashboard-header"
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pt-4 sm:pt-6"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400 font-medium text-sm">
            <span>{getGreeting(t)}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span className="truncate max-w-[200px]">
              {profile?.studio_name || profile?.name || t("common.name")}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Dashboard
          </h1>

          {contextualTip && (
            <div
              className={`flex items-center gap-2 mt-3 ${contextualTip.color} animate-in fade-in slide-in-from-left-2 duration-500`}
            >
              <contextualTip.icon className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium">{contextualTip.text}</p>
            </div>
          )}
        </div>

        <Link
          to="/partner/deliveries/new"
          className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold shadow-lg shadow-gray-900/10 dark:shadow-white/10 overflow-hidden transition-transform active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative z-10 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span>{t("partner.deliveries.newDelivery")}</span>
          </span>
        </Link>
      </div>

      {/* Onboarding Section - Only shows if not completed */}
      <PartnerOnboarding stats={onboardingStats} />

      {/* 
        PREMIUM CREDIT CARD
        Replaces the old cards with a digital wallet style card
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Wallet Card */}
        <div
          data-tour="credits-card"
          className="lg:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8 shadow-2xl shadow-gray-200/50 dark:shadow-none isolate group"
        >
          {/* Background Gradients */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none group-hover:bg-pink-500/30 transition-colors duration-700" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[60px] -ml-20 -mb-20 pointer-events-none group-hover:bg-blue-500/30 transition-colors duration-700" />

          {/* Card Content */}
          <div className="relative z-10 flex flex-col md:flex-row justify-between h-full gap-8">
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6 opacity-80">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium tracking-wide text-sm uppercase">
                    BabyBook Business
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">
                    Saldo Disponível
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl sm:text-7xl font-bold tracking-tighter">
                      {availableCredits}
                    </span>
                    <span className="text-xl text-gray-400 font-medium">
                      créditos
                    </span>
                  </div>
                </div>
              </div>

              {/* Reserved Credits Info */}
              <div className="mt-8 flex items-center gap-2 text-sm text-gray-400">
                <Info className="w-4 h-4" />
                <span>
                  <strong className="text-white">
                    {reservedCredits} créditos
                  </strong>{" "}
                  reservados em rascunhos
                </span>
              </div>
            </div>

            {/* Actions Column */}
            <div className="flex flex-col justify-end gap-3 min-w-[200px]">
              <Link
                to="/partner/credits"
                className="flex items-center justify-between px-5 py-4 bg-white text-gray-900 rounded-2xl font-bold hover:bg-gray-50 active:scale-95 transition-all shadow-lg"
              >
                <span>Comprar Créditos</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/partner/credits/extract"
                className="flex items-center justify-between px-5 py-4 bg-white/10 text-white rounded-2xl font-semibold hover:bg-white/15 backdrop-blur-md active:scale-95 transition-all"
              >
                <span>Extrato e Uso</span>
                <ChevronRight className="w-5 h-5 opacity-60" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Tip / Action Card */}
        <div className="lg:col-span-1 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 shadow-xl shadow-gray-100/50 dark:shadow-none flex flex-col justify-center relative overflow-hidden">
          {pendingUpload ? (
            <Link
              to={`/partner/deliveries/${pendingUpload.id}/upload`}
              className="flex flex-col h-full justify-between group"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  Continuar Entrega
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Você tem uma entrega pendente de upload. Finalize agora para
                  liberar.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-1 transition-transform">
                <span>Retomar Upload</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ) : readyDeliveries > 0 ? (
            <Link
              to="/partner/deliveries?status=ready"
              className="flex flex-col h-full justify-between group"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Gift className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  Liberar Entregas
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Você tem <strong>{readyDeliveries} entregas</strong> prontas.
                  Gere os links ou vouchers agora.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold group-hover:translate-x-1 transition-transform">
                <span>Ver Prontas</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ) : (
            <div className="flex flex-col h-full justify-between">
              <div className="w-14 h-14 rounded-2xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  Tudo em dia!
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Você não tem ações pendentes urgentes. Que tal criar uma nova
                  entrega?
                </p>
              </div>
              <div className="mt-6">
                <Link
                  to="/partner/deliveries/new"
                  className="inline-flex items-center gap-2 text-pink-600 dark:text-pink-400 font-bold hover:translate-x-1 transition-transform"
                >
                  <span>Nova Entrega</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid - using updated StatCard which handles internal styling */}
      <div
        data-tour="stats-grid"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
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
          // 'pending_vouchers' from stats represents deliveries waiting redemption
          value={stats?.pending_vouchers || 0}
          color="purple"
          to="/partner/deliveries?voucher=with&redeemed=not_redeemed"
          description="Aguardando resgate"
        />
        <StatCard
          icon={Gift}
          label={t("partner.dashboard.stats.completedDeliveries")}
          // 'delivered_deliveries' represents actual redeemed/finalized
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
        className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 dark:border-gray-700/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("partner.dashboard.recentDeliveries")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Suas últimas atividades
            </p>
          </div>
          <Link
            to="/partner/deliveries"
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-900/20 dark:hover:text-pink-400 transition-colors font-medium text-sm"
          >
            <span>{t("common.all")}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {deliveries.length === 0 ? (
          <div className="p-12 sm:p-16 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center mb-6 rotate-3">
              <Sparkles className="w-8 h-8 text-pink-500 dark:text-pink-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t("partner.dashboard.startFirstDelivery")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
              {t("partner.deliveries.list.emptyDescription")}
            </p>
            <Link
              to="/partner/deliveries/new"
              className="inline-flex items-center gap-2 px-8 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 active:scale-[0.98] transition-all font-bold shadow-lg shadow-pink-500/20"
            >
              <Plus className="w-5 h-5" />
              {t("partner.deliveries.newDelivery")}
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile: cards with improved spacing */}
            <div className="lg:hidden grid gap-4 p-4">
              {deliveries.map((delivery) => (
                <DeliveryCardMobile
                  key={delivery.id}
                  delivery={delivery}
                  onArchive={() => {}}
                  isArchiving={false}
                  variant="dashboard"
                />
              ))}
            </div>
            {/* Desktop Table with refined styling */}
            <div className="hidden lg:block overflow-x-auto">
              <div className="flex flex-col min-w-[700px]">
                <div className={`grid ${DELIVERY_GRID_COLS} items-center gap-4 px-6 py-4 bg-gray-50/50 dark:bg-gray-900/30 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800/50`}>
                  <div>Entrega / Cliente</div>
                  <div>Status</div>
                  <div>Voucher</div>
                  <div>Criado em</div>
                  <div className="text-right">Ações</div>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {deliveries.map((delivery) => (
                    <DeliveryTableRow
                      key={delivery.id}
                      delivery={delivery}
                      isSelected={false}
                      onPreview={() =>
                        navigate(`/partner/deliveries/${delivery.id}`)
                      }
                      onArchive={() => {}}
                      isArchiving={false}
                      variant="dashboard"
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <GuidedTour steps={PARTNER_TOUR_STEPS} tourKey={TOUR_COMPLETED_KEY_B2B} />
    </PartnerPage>
  );
}

export default PartnerDashboard;
