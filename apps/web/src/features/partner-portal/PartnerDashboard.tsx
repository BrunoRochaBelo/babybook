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
  Image,
  Plus,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Gift,
  Settings,
  RefreshCcw,
} from "lucide-react";
import {
  getPartnerProfile,
  getPartnerDashboardStats,
  listDeliveries,
} from "./api";
import type { Delivery } from "./types";
import {
  PartnerPageHeaderAction,
  usePartnerPageHeader,
} from "@/layouts/partnerPageHeader";
import { PartnerPage } from "@/layouts/PartnerPage";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DeliveryStatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { icon: typeof Clock; className: string; label: string }
  > = {
    draft: {
      icon: Clock,
      className:
        "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      label: "Rascunho",
    },
    pending_upload: {
      icon: Clock,
      className:
        "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300",
      label: "Aguardando upload",
    },
    processing: {
      icon: Loader2,
      className:
        "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
      label: "Processando",
    },
    ready: {
      icon: CheckCircle2,
      className:
        "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
      label: "Pronta",
    },
    delivered: {
      icon: Gift,
      className:
        "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
      label: "Entregue",
    },
    archived: {
      icon: Package,
      className:
        "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
      label: "Arquivada",
    },
  };

  const cfg = config[status] || config.draft;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export function PartnerDashboard() {
  const navigate = useNavigate();

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
    data: deliveriesData,
    isLoading: loadingDeliveries,
    isError: isDeliveriesError,
    error: deliveriesError,
    refetch: refetchDeliveries,
  } = useQuery({
    queryKey: ["partner", "deliveries", "recent"],
    queryFn: () => listDeliveries({ limit: 5 }),
  });

  const isLoading = loadingProfile || loadingStats || loadingDeliveries;

  usePartnerPageHeader(
    useMemo(
      () => ({
        title: "Dashboard",
        actions: (
          <PartnerPageHeaderAction
            to="/partner/deliveries/new"
            label="Nova entrega"
            tone="primary"
            icon={<Plus className="w-4 h-4" />}
          />
        ),
      }),
      [],
    ),
  );

  const handleRetry = () => {
    refetchProfile();
    refetchStats();
    refetchDeliveries();
  };

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

  const isError = isProfileError || isStatsError || isDeliveriesError;
  if (isError) {
    const message =
      (profileError instanceof Error && profileError.message) ||
      (statsError instanceof Error && statsError.message) ||
      (deliveriesError instanceof Error && deliveriesError.message) ||
      "Não foi possível carregar o dashboard.";

    return (
      <PartnerPage>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Ops — tivemos um problema
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {message}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Tentar novamente
                </button>
                <Link
                  to="/partner/deliveries"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-500 text-white hover:bg-pink-600"
                >
                  <Package className="w-4 h-4" />
                  Ir para entregas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PartnerPage>
    );
  }

  const deliveries = deliveriesData?.deliveries || [];
  const voucherBalance = stats?.voucher_balance || 0;
  const hasLowCredits = voucherBalance <= 2;
  const pendingUpload = deliveries.find((d) => d.status === "pending_upload");

  return (
    <PartnerPage>
      {/* Page Header (desktop) */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {profile?.studio_name || profile?.name
              ? `Bem-vindo, ${profile?.studio_name || profile?.name}.`
              : "Bem-vindo."}
          </p>
        </div>
        <Link
          to="/partner/deliveries/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nova Entrega</span>
          <span className="sm:hidden">Nova</span>
        </Link>
      </div>

      {/* Mobile intro (mantém contexto sem duplicar o header) */}
      <div className="md:hidden mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {profile?.studio_name || profile?.name ? (
            <>
              Bem-vindo,{" "}
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {profile?.studio_name || profile?.name}
              </span>
            </>
          ) : (
            "Bem-vindo"
          )}
        </p>
      </div>

      {/* Credit Balance Card - Destaque principal */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-pink-100 text-xs sm:text-sm font-medium uppercase tracking-wide">
                  Saldo de Créditos
                </p>
                {hasLowCredits ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white border border-white/20">
                    Saldo baixo
                  </span>
                ) : null}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-bold">
                  {voucherBalance}
                </span>
                <span className="text-pink-100 text-sm sm:text-base">
                  vouchers disponíveis
                </span>
              </div>
              <p className="text-pink-100 text-xs sm:text-sm mt-2 hidden sm:block">
                Cada crédito = 1 entrega para cliente
              </p>
            </div>
            <Link
              to="/partner/credits"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white text-pink-600 rounded-xl hover:bg-pink-50 transition-colors font-semibold shadow-sm"
            >
              <CreditCard className="w-5 h-5" />
              <span className="hidden sm:inline">Comprar Créditos</span>
              <span className="sm:hidden">Comprar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Próximos passos (compacto) */}
      <div className="mb-6 sm:mb-8 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Próximos passos
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            O que você pode fazer agora para manter o fluxo rodando.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pendingUpload ? (
              <Link
                to={`/partner/deliveries/${pendingUpload.id}/upload`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Continuar upload
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {pendingUpload.title ||
                      pendingUpload.client_name ||
                      "Entrega"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-500" />
              </Link>
            ) : null}

            {(stats?.ready_deliveries || 0) > 0 ? (
              <Link
                to="/partner/deliveries?status=ready"
                className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Entregas prontas
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {stats?.ready_deliveries} aguardando voucher
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-500" />
              </Link>
            ) : null}

            {hasLowCredits ? (
              <Link
                to="/partner/credits"
                className="group flex items-center justify-between gap-3 rounded-xl border border-pink-200 dark:border-pink-900/50 bg-pink-50 dark:bg-pink-900/10 px-3 py-2.5 hover:bg-pink-100/70 dark:hover:bg-pink-900/20 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Reforçar créditos
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Evite ficar sem vouchers
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Atalhos
          </p>
          <div className="mt-3 space-y-2">
            <Link
              to="/partner/deliveries/new"
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Nova entrega
              </span>
              <Plus className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              to="/partner/deliveries"
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Ver entregas
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              to="/partner/settings"
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Meu perfil
              </span>
              <Settings className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          icon={Package}
          label="Total Entregas"
          value={stats?.total_deliveries || 0}
          color="blue"
          to="/partner/deliveries"
          description="Todas as entregas"
        />
        <StatCard
          icon={CheckCircle2}
          label="Prontas"
          value={stats?.ready_deliveries || 0}
          color="green"
          to="/partner/deliveries?status=ready"
          description="Aguardando voucher"
        />
        <StatCard
          icon={Ticket}
          label="Vouchers Gerados"
          value={stats?.total_vouchers || 0}
          color="purple"
          to="/partner/deliveries?status=delivered"
          description="Com voucher ativo"
        />
        <StatCard
          icon={Gift}
          label="Resgatados"
          value={stats?.redeemed_vouchers || 0}
          color="pink"
          to="/partner/notifications"
          description="Clientes convertidos"
        />
      </div>

      {/* Recent Deliveries */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Entregas Recentes
          </h2>
          <Link
            to="/partner/deliveries"
            className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 font-medium inline-flex items-center gap-1"
          >
            Ver todas
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {deliveries.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Você ainda não tem entregas
            </p>
            <Link
              to="/partner/deliveries/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Primeira Entrega
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {deliveries.map((delivery) => (
              <Link
                key={delivery.id}
                to={`/partner/deliveries/${delivery.id}`}
                className="flex items-start sm:items-center justify-between gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Image className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {delivery.title || delivery.client_name || "Sem título"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                      {delivery.client_name ? (
                        <span className="truncate">{delivery.client_name}</span>
                      ) : null}
                      {delivery.client_name ? (
                        <span className="hidden sm:inline">•</span>
                      ) : null}
                      <span>{delivery.assets_count} arquivos</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{formatDate(delivery.created_at)}</span>
                      <span className="sm:hidden">
                        <DeliveryStatusBadge status={delivery.status} />
                      </span>
                      {delivery.voucher_code ? (
                        <span className="sm:hidden text-[11px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                          {delivery.voucher_code}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                  <DeliveryStatusBadge status={delivery.status} />
                  {delivery.voucher_code && (
                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                      {delivery.voucher_code}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="sm:hidden flex items-center flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions (secundário) */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          to="/partner/deliveries/new"
          icon={Plus}
          title="Nova Entrega"
          description="Envie fotos para um cliente"
        />
        <QuickAction
          to="/partner/credits"
          icon={CreditCard}
          title="Comprar Créditos"
          description="Adicione mais vouchers"
        />
        <QuickAction
          to="/partner/settings"
          icon={Settings}
          title="Meu Perfil"
          description="Configure seu estúdio"
        />
      </div>
    </PartnerPage>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface StatCardProps {
  icon: typeof Package;
  label: string;
  value: number;
  color: "blue" | "green" | "purple" | "pink";
  to?: string;
  description?: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  to,
  description,
}: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    purple:
      "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    pink: "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
  };

  const content = (
    <>
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]} mb-3`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      {description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {description}
        </p>
      )}
      {to && (
        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-pink-600 dark:text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Clique para ver
          <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="group bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 hover:shadow-md transition-all cursor-pointer"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      {content}
    </div>
  );
}

interface QuickActionProps {
  to: string;
  icon: typeof Package;
  title: string;
  description: string;
}

function QuickAction({ to, icon: Icon, title, description }: QuickActionProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 hover:shadow-sm transition-all"
    >
      <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
      </div>
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </Link>
  );
}

export default PartnerDashboard;
