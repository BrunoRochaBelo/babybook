import type { ReactNode } from "react";
import { createContext, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export type PartnerPageHeaderBadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "info"
  | "purple";

export type PartnerPageHeaderConfig = {
  title: string;
  backTo?: string;
  backLabel?: string;
  badge?: {
    text: string;
    tone?: PartnerPageHeaderBadgeTone;
  };
  actions?: ReactNode;
};

type PartnerPageHeaderActionTone = "primary" | "neutral";

type PartnerPageHeaderActionProps = {
  label: string;
  icon: ReactNode;
  tone?: PartnerPageHeaderActionTone;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Ação padronizada (icon-only) para o header sticky no mobile.
 *
 * Motivo: manter consistência visual e evitar overflow em telas pequenas.
 */
export function PartnerPageHeaderAction({
  label,
  icon,
  tone = "neutral",
  to,
  onClick,
  disabled,
  className,
}: PartnerPageHeaderActionProps) {
  const base =
    "inline-flex items-center justify-center w-9 h-9 rounded-xl transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed";

  const toneClass =
    tone === "primary"
      ? "bg-pink-500 text-white hover:bg-pink-600"
      : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40";

  const merged = cn(base, toneClass, className);

  if (to) {
    return (
      <Link
        to={to}
        aria-label={label}
        title={label}
        className={merged}
        data-partner-page-header-action="true"
      >
        {icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={merged}
      data-partner-page-header-action="true"
    >
      {icon}
    </button>
  );
}

type PartnerPageHeaderApi = {
  setHeader: (config: PartnerPageHeaderConfig | null) => void;
};

export const PartnerPageHeaderContext =
  createContext<PartnerPageHeaderApi | null>(null);

/**
 * Registra o header sticky (mobile) dentro do PartnerLayout.
 *
 * Guia de uso:
 * - Telas “top-level” do módulo (/partner, /partner/deliveries, /partner/credits, etc.)
 *   normalmente NÃO devem ter backTo/backLabel, para evitar um “voltar” redundante.
 * - Use backTo/backLabel em rotas filhas (ex.: detalhe, criação, upload), onde o usuário
 *   precisa de navegação contextual.
 * - Prefira passar um config estável (useMemo), especialmente quando houver actions em JSX.
 */
export function usePartnerPageHeader(config: PartnerPageHeaderConfig | null) {
  const ctx = useContext(PartnerPageHeaderContext);

  useEffect(() => {
    if (!ctx) return;
    ctx.setHeader(config);
    return () => ctx.setHeader(null);
  }, [ctx, config]);
}
