/**
 * Partner Stat Card
 *
 * Card de estatísticas reutilizável para o Portal do Parceiro.
 * Exibe métricas com ícone, valor e descrição.
 */

import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardColor = "blue" | "green" | "purple" | "pink" | "yellow" | "gray";

interface StatCardProps {
  /** Componente de ícone (Lucide) */
  icon: ComponentType<{ className?: string }>;
  /** Label do card */
  label: string;
  /** Valor numérico */
  value: number;
  /** Cor do ícone e destaque */
  color?: StatCardColor;
  /** Link de destino ao clicar */
  to?: string;
  /** Descrição adicional */
  description?: string;
  /** Classes CSS adicionais */
  className?: string;
}

const colorConfigs: Record<
  StatCardColor,
  { bg: string; text: string; ring: string; iconBg: string }
> = {
  blue: {
    bg: "hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
    text: "text-blue-600 dark:text-blue-400",
    ring: "hover:ring-blue-100 dark:hover:ring-blue-900/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
  },
  green: {
    bg: "hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "hover:ring-emerald-100 dark:hover:ring-emerald-900/30",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  purple: {
    bg: "hover:bg-purple-50/50 dark:hover:bg-purple-900/10",
    text: "text-purple-600 dark:text-purple-400",
    ring: "hover:ring-purple-100 dark:hover:ring-purple-900/30",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
  },
  pink: {
    bg: "hover:bg-pink-50/50 dark:hover:bg-pink-900/10",
    text: "text-pink-600 dark:text-pink-400",
    ring: "hover:ring-pink-100 dark:hover:ring-pink-900/30",
    iconBg: "bg-pink-100 dark:bg-pink-900/30",
  },
  yellow: {
    bg: "hover:bg-amber-50/50 dark:hover:bg-amber-900/10",
    text: "text-amber-600 dark:text-amber-400",
    ring: "hover:ring-amber-100 dark:hover:ring-amber-900/30",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
  },
  gray: {
    bg: "hover:bg-gray-50/50 dark:hover:bg-gray-800/10",
    text: "text-gray-600 dark:text-gray-400",
    ring: "hover:ring-gray-200 dark:hover:ring-gray-700",
    iconBg: "bg-gray-100 dark:bg-gray-700",
  },
};

/**
 * Card de estatísticas para exibição de métricas.
 *
 * Features:
 * - Feedback tátil (active:scale-[0.98])
 * - Animação de entrada suave
 * - Style premium "bento grid"
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  color = "gray",
  to,
  description,
  className,
}: StatCardProps) {
  const config = colorConfigs[color];

  const baseClass = cn(
    // Layout
    "relative overflow-hidden group p-5 rounded-[2rem]",
    "bg-white dark:bg-gray-800",
    "border border-gray-100 dark:border-gray-700/50",
    // Shadow
    "shadow-sm hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none transition-all duration-500",
    // Color interaction
    config.bg,
    "hover:ring-1",
    config.ring,
    // Animation
    "animate-in fade-in-0 slide-in-from-bottom-2 duration-500",
    className,
  );

  const content = (
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
            config.iconBg,
            config.text,
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        
        {to && (
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 bg-white/80 dark:bg-gray-700/80 backdrop-blur shadow-sm",
            config.text
          )}>
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-auto">
        <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tight mb-1">
          {value.toLocaleString("pt-BR")}
        </p>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 leading-tight">
          {label}
        </p>
        
        {description && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
             <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
              {description}
            </p>
          </div>
        )}
      </div>
      
      {/* Decorative gradient blob */}
      <div className={cn(
        "absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none",
        config.text.replace("text-", "bg-")
      )} />
    </div>
  );

  if (to) {
    return (
      <Link to={to} className={cn(baseClass, "block cursor-pointer active:scale-[0.98]")}>
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
}

export default StatCard;
