import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PartnerPage } from "@/layouts/PartnerPage";

type PartnerPageSize = "narrow" | "default" | "wide";

type PartnerStateVariant = "page" | "section";

type PartnerStateTone = "neutral" | "warning" | "danger";

type PartnerStateAction =
  | {
      label: string;
      to: string;
      onClick?: never;
      disabled?: never;
      icon?: ComponentType<{ className?: string }>;
    }
  | {
      label: string;
      onClick: () => void;
      disabled?: boolean;
      to?: never;
      icon?: ComponentType<{ className?: string }>;
    };

function toneStyles(tone: PartnerStateTone) {
  switch (tone) {
    case "warning":
      return {
        icon: "text-yellow-500",
        title: "text-gray-900 dark:text-white",
        description: "text-gray-600 dark:text-gray-400",
        border: "border-gray-200 dark:border-gray-700",
      };
    case "danger":
      return {
        icon: "text-red-500",
        title: "text-gray-900 dark:text-white",
        description: "text-gray-600 dark:text-gray-400",
        border: "border-red-200/60 dark:border-red-900/40",
      };
    case "neutral":
    default:
      return {
        icon: "text-gray-400 dark:text-gray-500",
        title: "text-gray-900 dark:text-white",
        description: "text-gray-600 dark:text-gray-400",
        border: "border-gray-200 dark:border-gray-700",
      };
  }
}

function PrimaryAction({ action }: { action: PartnerStateAction }) {
  const Icon = action.icon;

  const baseClass =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-pink-500 text-white hover:bg-pink-600 transition-colors";

  if ("to" in action && typeof action.to === "string") {
    return (
      <Link to={action.to} className={baseClass}>
        {Icon ? <Icon className="w-4 h-4" /> : null}
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className={cn(baseClass, action.disabled ? "opacity-60" : null)}
    >
      {Icon ? <Icon className="w-4 h-4" /> : null}
      {action.label}
    </button>
  );
}

function SecondaryAction({ action }: { action: PartnerStateAction }) {
  const Icon = action.icon;

  const baseClass =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors";

  if ("to" in action && typeof action.to === "string") {
    return (
      <Link to={action.to} className={baseClass}>
        {Icon ? <Icon className="w-4 h-4" /> : null}
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className={cn(baseClass, action.disabled ? "opacity-60" : null)}
    >
      {Icon ? <Icon className="w-4 h-4" /> : null}
      {action.label}
    </button>
  );
}

function StateBody({
  variant,
  tone,
  icon: Icon,
  title,
  description,
  actions,
  children,
}: {
  variant: PartnerStateVariant;
  tone: PartnerStateTone;
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actions?: {
    primary?: PartnerStateAction;
    secondary?: PartnerStateAction;
  };
  children?: ReactNode;
}) {
  const styles = toneStyles(tone);

  // Cores do círculo do ícone baseado no tone
  const iconCircleClass =
    tone === "danger"
      ? "bg-red-100 dark:bg-red-900/30"
      : tone === "warning"
        ? "bg-yellow-100 dark:bg-yellow-900/30"
        : "bg-gray-100 dark:bg-gray-700";

  const wrapClass =
    variant === "page" ? "bg-white dark:bg-gray-800 rounded-2xl border shadow-lg p-8" : "";

  const innerClass =
    variant === "page" ? "max-w-md mx-auto text-center" : "text-center";

  const padClass = variant === "page" ? "" : "py-12";

  return (
    <div className={cn(wrapClass, styles.border)}>
      <div className={cn(innerClass, padClass)}>
        {/* Ícone grande em círculo */}
        {Icon ? (
          <div
            className={cn(
              "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
              iconCircleClass,
            )}
          >
            <Icon className={cn("w-8 h-8", styles.icon)} />
          </div>
        ) : null}

        {/* Título */}
        <h2 className={cn("text-xl font-bold mb-2", styles.title)}>{title}</h2>

        {/* Descrição */}
        {description ? (
          <p className={cn("text-sm mb-4", styles.description)}>
            {description}
          </p>
        ) : null}

        {/* Conteúdo adicional (ex: detalhes do erro) */}
        {children ? <div className="mb-4">{children}</div> : null}

        {/* Botões de ação */}
        {actions?.primary || actions?.secondary ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            {actions.secondary ? (
              <SecondaryAction action={actions.secondary} />
            ) : null}
            {actions.primary ? (
              <PrimaryAction action={actions.primary} />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PartnerLoadingState({
  variant = "page",
  size = "default",
  label = "Carregando…",
}: {
  variant?: PartnerStateVariant;
  size?: PartnerPageSize;
  label?: string;
}) {
  const body = (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center",
        variant === "page" ? "py-24" : "py-12",
      )}
    >
      <div className="inline-flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
        <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
        <span>{label}</span>
      </div>
    </div>
  );

  if (variant === "page") {
    return <PartnerPage size={size}>{body}</PartnerPage>;
  }

  return body;
}

export function PartnerErrorState({
  variant = "page",
  size = "default",
  title = "Ops — algo deu errado",
  description = "Tente novamente em instantes.",
  onRetry,
  primaryAction,
  secondaryAction,
}: {
  variant?: PartnerStateVariant;
  size?: PartnerPageSize;
  title?: string;
  description?: string;
  onRetry?: () => void;
  primaryAction?: PartnerStateAction;
  secondaryAction?: PartnerStateAction;
}) {
  const actions =
    primaryAction || secondaryAction || onRetry
      ? {
          primary:
            primaryAction ??
            (onRetry
              ? { label: "Tentar novamente", onClick: onRetry }
              : undefined),
          secondary: secondaryAction,
        }
      : undefined;

  const content = (
    <div role="alert" aria-live="assertive">
      <StateBody
        variant={variant}
        tone="danger"
        icon={AlertCircle}
        title={title}
        description={description}
        actions={actions}
      />
    </div>
  );

  if (variant === "page") {
    return <PartnerPage size={size}>{content}</PartnerPage>;
  }

  return content;
}

export function PartnerEmptyState({
  variant = "page",
  size = "default",
  tone = "neutral",
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  variant?: PartnerStateVariant;
  size?: PartnerPageSize;
  tone?: PartnerStateTone;
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  primaryAction?: PartnerStateAction;
  secondaryAction?: PartnerStateAction;
}) {
  const content = (
    <StateBody
      variant={variant}
      tone={tone}
      icon={icon}
      title={title}
      description={description}
      actions={
        primaryAction || secondaryAction
          ? { primary: primaryAction, secondary: secondaryAction }
          : undefined
      }
    />
  );

  if (variant === "page") {
    return <PartnerPage size={size}>{content}</PartnerPage>;
  }

  return content;
}
