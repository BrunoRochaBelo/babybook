/**
 * Partner Detailed Stats Component
 *
 * Seção de estatísticas detalhadas que aparece apenas para
 * parceiros com 5 ou mais entregas. Mostra métricas avançadas
 * como taxa de conversão, média de fotos e histórico.
 */

import { useMemo } from "react";
import {
  TrendingUp,
  Camera,
  CalendarDays,
  Gift,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface DetailedStatsProps {
  totalDeliveries: number;
  totalVouchers: number;
  redeemedVouchers: number;
  isLoading?: boolean;
  deliveries: Array<{
    id: string;
    created_at: string;
    assets_count?: number | null;
    redeemed_at?: string | null;
    client_name?: string | null;
  }>;
}

interface StatItemProps {
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
  subValue?: string;
  color: "pink" | "green" | "blue" | "purple";
}

function StatItem({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: StatItemProps) {
  const colorClasses = {
    pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
    green:
      "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    purple:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          colorClasses[color],
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {value}
        </p>
        {subValue && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{subValue}</p>
        )}
      </div>
    </div>
  );
}

export function PartnerDetailedStats({
  totalDeliveries,
  totalVouchers,
  redeemedVouchers,
  isLoading,
  deliveries,
}: DetailedStatsProps) {
  // Calcular métricas (precisa vir antes dos early returns para respeitar as regras de hooks)
  const stats = useMemo(() => {
    // Taxa de conversão
    const conversionRate =
      totalVouchers > 0
        ? Math.round((redeemedVouchers / totalVouchers) * 100)
        : 0;

    // Média de fotos por entrega
    const totalAssets = deliveries.reduce(
      (sum, d) => sum + (d.assets_count || 0),
      0,
    );
    const avgPhotos =
      deliveries.length > 0 ? Math.round(totalAssets / deliveries.length) : 0;

    // Entregas por mês (últimos 3 meses)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const monthlyDeliveries: Record<string, number> = {};

    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString("pt-BR", { month: "short" });
      monthlyDeliveries[key] = 0;
    }

    deliveries.forEach((d) => {
      const date = new Date(d.created_at);
      if (date >= threeMonthsAgo) {
        const key = date.toLocaleDateString("pt-BR", { month: "short" });
        if (monthlyDeliveries[key] !== undefined) {
          monthlyDeliveries[key]++;
        }
      }
    });

    // Último resgate
    const lastRedeemed = deliveries
      .filter((d) => d.redeemed_at)
      .sort(
        (a, b) =>
          new Date(b.redeemed_at!).getTime() -
          new Date(a.redeemed_at!).getTime(),
      )[0];

    const lastRedemptionText = lastRedeemed
      ? `${lastRedeemed.client_name || "Cliente"} - ${new Date(lastRedeemed.redeemed_at!).toLocaleDateString("pt-BR")}`
      : "Nenhum resgate ainda";

    return {
      conversionRate,
      avgPhotos,
      monthlyDeliveries: Object.entries(monthlyDeliveries).reverse(),
      lastRedemptionText,
    };
  }, [totalVouchers, redeemedVouchers, deliveries]);

  // Só exibe se tiver 5+ entregas
  if (totalDeliveries < 5) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-3 w-64 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-transparent"
            >
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-5 w-36 rounded" />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3">
          <Skeleton className="h-4 w-40 rounded mb-3" />
          <div className="flex items-end gap-2 h-20">
            {Array.from({ length: 3 }).map((_, i) => (
               <Skeleton key={i} className="flex-1 h-full rounded-t-lg" style={{ height: `${30 + i * 20}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Encontrar o máximo para o gráfico de barras
  const maxMonthly = Math.max(
    ...stats.monthlyDeliveries.map(([, count]) => count),
    1,
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Estatísticas Detalhadas
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Métricas avançadas do seu estúdio
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <StatItem
          icon={TrendingUp}
          label="Taxa de Conversão"
          value={`${stats.conversionRate}%`}
          subValue="Vouchers resgatados / gerados"
          color="green"
        />
        <StatItem
          icon={Camera}
          label="Média de Fotos"
          value={`${stats.avgPhotos} fotos`}
          subValue="Por entrega"
          color="blue"
        />
        <StatItem
          icon={Gift}
          label="Último Resgate"
          value={stats.lastRedemptionText.split(" - ")[0]}
          subValue={
            stats.lastRedemptionText.includes(" - ")
              ? stats.lastRedemptionText.split(" - ")[1]
              : undefined
          }
          color="purple"
        />
        <StatItem
          icon={CalendarDays}
          label="Total de Entregas"
          value={totalDeliveries}
          subValue="Desde o início"
          color="pink"
        />
      </div>

      {/* Mini Bar Chart - Entregas por Mês */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Entregas por Mês
          </p>
        </div>
        <div className="flex items-end justify-between gap-2 h-20">
          {stats.monthlyDeliveries.map(([month, count]) => (
            <div
              key={month}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className="w-full bg-gradient-to-t from-pink-500 to-rose-400 rounded-t-md transition-all duration-500"
                style={{
                  height: `${Math.max((count / maxMonthly) * 100, count > 0 ? 15 : 5)}%`,
                  minHeight: count > 0 ? "12px" : "4px",
                }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {month}
              </span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PartnerDetailedStats;
