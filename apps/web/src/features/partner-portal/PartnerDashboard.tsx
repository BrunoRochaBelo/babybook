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
import { StatCard } from "@/layouts/StatCard";
import { PartnerErrorState } from "@/layouts/partnerStates";

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
      <PartnerErrorState
        variant="page"
        title="Ops! Algo deu errado"
        description={message}
        onRetry={handleRetry}
        secondaryAction={{
          label: "Ir para entregas",
          to: "/partner/deliveries",
          icon: Package,
        }}
      />
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
      <div className="mb-6 sm:mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
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
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white text-pink-600 rounded-xl hover:bg-pink-50 active:scale-[0.98] transition-all font-semibold shadow-sm"
            >
              <CreditCard className="w-5 h-5" />
              <span className="hidden sm:inline">Comprar Créditos</span>
              <span className="sm:hidden">Comprar</span>
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
                  Upload pendente
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300 truncate">
                  {pendingUpload.title || pendingUpload.client_name || "Entrega"} aguarda arquivos
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
                  {stats?.ready_deliveries} {stats?.ready_deliveries === 1 ? "entrega pronta" : "entregas prontas"}
                </p>
                <p className="text-xs text-green-600 dark:text-green-300">
                  Aguardando geração de voucher
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
                  Saldo baixo
                </p>
                <p className="text-xs text-pink-600 dark:text-pink-300">
                  Apenas {voucherBalance} {voucherBalance === 1 ? "crédito" : "créditos"} restante{voucherBalance === 1 ? "" : "s"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
          </Link>
        )}
      </div>
    )}

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
          <>
            {/* Mobile: cards */}
            <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {deliveries.map((delivery) => (
                <Link
                  key={delivery.id}
                  to={`/partner/deliveries/${delivery.id}`}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {delivery.title || delivery.client_name || "Sem título"}
                      </p>
                      <DeliveryStatusBadge status={delivery.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-gray-500 dark:text-gray-400">
                      {delivery.client_name && <span>{delivery.client_name}</span>}
                      <span>•</span>
                      <span>{formatDate(delivery.created_at)}</span>
                    </div>
                    {delivery.voucher_code && (
                      <span className="mt-1 inline-block text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                        {delivery.voucher_code}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </Link>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">Entrega</th>
                    <th className="text-left font-medium px-4 py-2.5">Cliente</th>
                    <th className="text-left font-medium px-4 py-2.5">Status</th>
                    <th className="text-left font-medium px-4 py-2.5">Criada em</th>
                    <th className="text-left font-medium px-4 py-2.5">Voucher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {deliveries.map((delivery) => (
                    <tr
                      key={delivery.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/partner/deliveries/${delivery.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {delivery.title || "Sem título"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {delivery.client_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <DeliveryStatusBadge status={delivery.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {formatDate(delivery.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {delivery.voucher_code ? (
                          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                            {delivery.voucher_code}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
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
