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

const colorClasses: Record<StatCardColor, string> = {
  blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  green: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  purple:
    "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  pink: "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
  yellow:
    "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
  gray: "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
};

/**
 * Card de estatísticas para exibição de métricas.
 *
 * Features:
 * - Feedback tátil (active:scale-[0.98])
 * - Animação de entrada suave
 * - Hover com borda rosa e sombra
 * - Suporte a link ou elemento estático
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
  const baseClass = cn(
    // Layout
    "bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700",
    // Animação de entrada
    "animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
    // Transições
    "transition-all",
    className,
  );

  const interactiveClass = cn(
    baseClass,
    // Hover
    "hover:border-pink-300 dark:hover:border-pink-600 hover:shadow-md",
    // Feedback tátil
    "active:scale-[0.98]",
    // Cursor
    "cursor-pointer",
    // Focus
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900",
  );

  const content = (
    <>
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
          colorClasses[color],
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
        {value.toLocaleString("pt-BR")}
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
      <Link to={to} className={cn(interactiveClass, "group block")}>
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
}

export default StatCard;
