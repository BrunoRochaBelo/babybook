/**
 * Partner Portal Dashboard
 *
 * Dashboard principal para fotógrafos gerenciarem:
 * - Saldo de créditos (voucher_balance)
 * - Compra de créditos
 * - Entregas e vouchers
 */

import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  getPartnerProfile,
  getPartnerDashboardStats,
  listDeliveries,
} from "./api";
import type { Delivery, PartnerDashboardStats, Partner } from "./types";

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
      className: "bg-gray-100 text-gray-700",
      label: "Rascunho",
    },
    pending_upload: {
      icon: Clock,
      className: "bg-yellow-100 text-yellow-700",
      label: "Aguardando upload",
    },
    processing: {
      icon: Loader2,
      className: "bg-blue-100 text-blue-700",
      label: "Processando",
    },
    ready: {
      icon: CheckCircle2,
      className: "bg-green-100 text-green-700",
      label: "Pronta",
    },
    delivered: {
      icon: Gift,
      className: "bg-purple-100 text-purple-700",
      label: "Entregue",
    },
    archived: {
      icon: Package,
      className: "bg-gray-100 text-gray-500",
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
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: getPartnerProfile,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["partner", "stats"],
    queryFn: getPartnerDashboardStats,
  });

  const { data: deliveriesData, isLoading: loadingDeliveries } = useQuery({
    queryKey: ["partner", "deliveries", "recent"],
    queryFn: () => listDeliveries({ limit: 5 }),
  });

  const isLoading = loadingProfile || loadingStats || loadingDeliveries;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  const deliveries = deliveriesData?.deliveries || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Portal do Parceiro
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Olá, {profile?.studio_name || profile?.name}! 👋
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
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Credit Balance Card - Destaque principal */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-pink-100 text-xs sm:text-sm font-medium uppercase tracking-wide">
                  Saldo de Créditos
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-bold">
                    {stats?.voucher_balance || 0}
                  </span>
                  <span className="text-pink-100 text-sm sm:text-base">vouchers disponíveis</span>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            icon={Package}
            label="Total Entregas"
            value={stats?.total_deliveries || 0}
            color="blue"
          />
          <StatCard
            icon={CheckCircle2}
            label="Prontas"
            value={stats?.ready_deliveries || 0}
            color="green"
          />
          <StatCard
            icon={Ticket}
            label="Vouchers Gerados"
            value={stats?.total_vouchers || 0}
            color="purple"
          />
          <StatCard
            icon={Gift}
            label="Resgatados"
            value={stats?.redeemed_vouchers || 0}
            color="pink"
          />
        </div>

        {/* Recent Deliveries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Entregas Recentes
            </h2>
            <Link
              to="/partner/deliveries"
              className="text-sm text-pink-600 hover:text-pink-700 font-medium inline-flex items-center gap-1"
            >
              Ver todas
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {deliveries.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Você ainda não tem entregas</p>
              <Link
                to="/partner/deliveries/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Criar Primeira Entrega
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {deliveries.map((delivery) => (
                <Link
                  key={delivery.id}
                  to={`/partner/deliveries/${delivery.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {delivery.title || delivery.client_name || "Sem título"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {delivery.client_name && `${delivery.client_name} • `}
                        {delivery.assets_count} arquivos •{" "}
                        {formatDate(delivery.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <DeliveryStatusBadge status={delivery.status} />
                    {delivery.voucher_code && (
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {delivery.voucher_code}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
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
            icon={Package}
            title="Meu Perfil"
            description="Configure seu estúdio"
          />
        </div>
      </main>
    </div>
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
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]} mb-3`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
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
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-pink-300 hover:shadow-sm transition-all"
    >
      <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-pink-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  );
}

export default PartnerDashboard;
