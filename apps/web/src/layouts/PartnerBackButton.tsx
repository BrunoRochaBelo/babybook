/**
 * Partner Back Button
 *
 * Componente reutilizável para botão "Voltar" padronizado
 * em todas as páginas do Portal do Parceiro.
 */

import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type PartnerBackButtonProps = {
  /** Rota de destino. Se não informada, usa navigate(-1) */
  to?: string;
  /** Label acessível e texto visível */
  label?: string;
  /** Classes CSS adicionais */
  className?: string;
};

/**
 * Botão "Voltar" padronizado para o Portal do Parceiro.
 *
 * - Visível apenas em desktop (hidden md:inline-flex)
 * - Estilo consistente: texto cinza, hover rosa suave
 * - Ícone ArrowLeft à esquerda
 */
export function PartnerBackButton({
  to,
  label = "Voltar",
  className,
}: PartnerBackButtonProps) {
  const navigate = useNavigate();

  const baseClass = cn(
    "inline-flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400",
    "hover:text-pink-600 dark:hover:text-pink-400",
    "hover:bg-pink-50 dark:hover:bg-pink-900/20",
    "transition-all duration-200 mb-4",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
    "dark:focus-visible:ring-offset-gray-900",
    "rounded-xl px-4 py-2 -ml-4",
    className,
  );

  if (to) {
    return (
      <Link to={to} aria-label={label} className={baseClass}>
        <ArrowLeft className="w-4 h-4" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label={label}
      className={baseClass}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

export default PartnerBackButton;
