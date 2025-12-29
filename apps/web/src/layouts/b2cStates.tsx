/**
 * B2C App States
 *
 * Sistema de estados padronizado para o app B2C, inspirado em partnerStates.tsx.
 * Mantém o esquema de cores do B2C (laranjas/verdes) com suporte a dark mode.
 */

import React, { type ComponentType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

type B2CPageSize = "narrow" | "default" | "wide";

type B2CStateVariant = "page" | "section" | "inline";

type B2CStateTone = "neutral" | "success" | "warning" | "danger";

type B2CStateAction =
  | {
      label: string;
      to: string;
      onClick?: never;
      disabled?: never;
      icon?: ComponentType<{ className?: string }>;
      className?: string;
    }
  | {
      label: string;
      onClick: () => void;
      disabled?: boolean;
      to?: never;
      icon?: ComponentType<{ className?: string }>;
      className?: string;
    };

// =============================================================================
// STYLE HELPERS
// =============================================================================

function toneStyles(tone: B2CStateTone) {
  switch (tone) {
    case "success":
      return {
        icon: "text-[var(--bb-color-success)]",
        iconBg: "bg-[var(--bb-color-success)]/20 dark:bg-[var(--bb-color-success)]/10",
        iconRing: "ring-1 ring-[var(--bb-color-success)]/30",
      };
    case "warning":
      return {
        icon: "text-amber-500 dark:text-amber-400",
        iconBg: "bg-amber-50 dark:bg-amber-900/20",
        iconRing: "ring-1 ring-amber-100 dark:ring-amber-800/30",
      };
    case "danger":
      return {
        icon: "text-[var(--bb-color-danger)] dark:text-red-400",
        iconBg: "bg-[var(--bb-color-danger-soft)] dark:bg-red-900/20",
        iconRing: "ring-1 ring-[var(--bb-color-danger)]/20 dark:ring-red-800/30",
      };
    case "neutral":
    default:
      return {
        icon: "text-[var(--bb-color-accent)]",
        iconBg: "bg-[var(--bb-color-accent)]/10 dark:bg-[var(--bb-color-accent)]/20",
        iconRing: "ring-1 ring-[var(--bb-color-accent)]/20",
      };
  }
}

// =============================================================================
// ACTION BUTTONS
// =============================================================================

function PrimaryAction({ action }: { action: B2CStateAction }) {
  const Icon = action.icon;

  // Usa cores primárias do B2C (laranja)
  const baseClass = cn(
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold",
    "bg-[var(--bb-color-accent)] text-white",
    "shadow-[0_8px_20px_rgba(242,153,93,0.25)] dark:shadow-[0_8px_20px_rgba(242,153,93,0.15)]",
    "hover:shadow-[0_12px_28px_rgba(242,153,93,0.35)] hover:-translate-y-0.5",
    "active:scale-[0.98] transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bb-color-accent)]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[var(--bb-color-bg)]",
    action.className
  );

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
      className={cn(baseClass, action.disabled && "opacity-60 cursor-not-allowed")}
    >
      {Icon ? <Icon className="w-4 h-4" /> : null}
      {action.label}
    </button>
  );
}

function SecondaryAction({ action }: { action: B2CStateAction }) {
  const Icon = action.icon;

  // Usa cores secundárias do B2C (verde/borda)
  const baseClass = cn(
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold",
    "border-2 border-[var(--bb-color-muted)] bg-[var(--bb-color-surface)] text-[var(--bb-color-ink)]",
    "hover:border-[var(--bb-color-accent)]/60 hover:text-[var(--bb-color-accent)]",
    "active:scale-[0.98] transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bb-color-muted)]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[var(--bb-color-bg)]",
    action.className
  );

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
      className={cn(baseClass, action.disabled && "opacity-60 cursor-not-allowed")}
    >
      {Icon ? <Icon className="w-4 h-4" /> : null}
      {action.label}
    </button>
  );
}

// =============================================================================
// STATE BODY (Internal component)
// =============================================================================

function StateBody({
  variant,
  tone,
  icon: Icon,
  title,
  description,
  actions,
  children,
}: {
  variant: B2CStateVariant;
  tone: B2CStateTone;
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actions?: {
    primary?: B2CStateAction;
    secondary?: B2CStateAction;
  };
  children?: ReactNode;
}) {
  const styles = toneStyles(tone);

  const wrapClass =
    variant === "page"
      ? "bg-[var(--bb-color-surface)] rounded-2xl border border-[var(--bb-color-border)] shadow-lg p-8"
      : variant === "section"
        ? "bg-[var(--bb-color-surface)]/50 rounded-2xl border border-[var(--bb-color-border)]/60 p-6"
        : "";

  const innerClass = variant !== "inline" ? "max-w-md mx-auto text-center" : "text-center";
  const padClass = variant === "page" ? "" : variant === "section" ? "" : "py-6";

  return (
    <div className={wrapClass}>
      <div className={cn(innerClass, padClass)}>
        {/* Ícone grande em círculo */}
        {Icon ? (
          <div
            className={cn(
              "w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-105",
              styles.iconBg,
              styles.iconRing
            )}
          >
            <Icon className={cn("w-8 h-8", styles.icon)} />
          </div>
        ) : null}

        {/* Título */}
        <h2 className="text-xl font-semibold text-[var(--bb-color-ink)] mb-2.5 font-serif">
          {title}
        </h2>

        {/* Descrição */}
        {description ? (
          <p className="text-sm text-[var(--bb-color-ink-muted)] mb-5 leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        ) : null}

        {/* Conteúdo adicional */}
        {children ? <div className="mb-5">{children}</div> : null}

        {/* Botões de ação */}
        {actions?.primary || actions?.secondary ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            {actions.secondary ? <SecondaryAction action={actions.secondary} /> : null}
            {actions.primary ? <PrimaryAction action={actions.primary} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// =============================================================================
// B2C PAGE WRAPPER
// =============================================================================

export function B2CPage({
  size = "default",
  children,
  className,
}: {
  size?: B2CPageSize;
  children: ReactNode;
  className?: string;
}) {
  const maxWidthClass =
    size === "narrow"
      ? "max-w-2xl"
      : size === "wide"
        ? "max-w-6xl"
        : "max-w-4xl";

  return (
    <div className={cn("mx-auto w-full px-4 py-6", maxWidthClass, className)}>
      {children}
    </div>
  );
}

// =============================================================================
// LOADING STATE
// =============================================================================

export function B2CLoadingState({
  variant = "page",
  size = "default",
  label = "Carregando…",
}: {
  variant?: B2CStateVariant;
  size?: B2CPageSize;
  label?: string;
}) {
  const body = (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center",
        variant === "page" ? "py-24" : variant === "section" ? "py-12" : "py-6"
      )}
    >
      <div className="inline-flex items-center gap-3 text-sm text-[var(--bb-color-ink-muted)]">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--bb-color-accent)]" />
        <span>{label}</span>
      </div>
    </div>
  );

  if (variant === "page") {
    return <B2CPage size={size}>{body}</B2CPage>;
  }

  return body;
}

// =============================================================================
// ERROR STATE
// =============================================================================

export function B2CErrorState({
  variant = "page",
  size = "default",
  title = "Ops! Algo deu errado",
  description,
  errorDetails,
  onRetry,
  primaryAction,
  secondaryAction,
  skeleton,
  autoReloadInDev = true,
}: {
  variant?: B2CStateVariant;
  size?: B2CPageSize;
  title?: string;
  description?: string;
  errorDetails?: string | null;
  onRetry?: () => void;
  primaryAction?: B2CStateAction;
  secondaryAction?: B2CStateAction;
  skeleton?: ReactNode;
  autoReloadInDev?: boolean;
}) {
  const isDev = import.meta.env.DEV;
  const RELOAD_KEY = "babybook_b2c_reload_attempts";
  const MAX_RETRIES = 3;

  const shouldAutoReload = isDev && autoReloadInDev;

  React.useEffect(() => {
    if (shouldAutoReload) {
      const attempts = parseInt(sessionStorage.getItem(RELOAD_KEY) || "0", 10);

      if (attempts >= MAX_RETRIES) {
        return;
      }

      console.info(
        `[babybook] Erro detectado em desenvolvimento. Tentativa ${attempts + 1}/${MAX_RETRIES} de recarregar...`
      );

      const timeoutId = setTimeout(() => {
        sessionStorage.setItem(RELOAD_KEY, (attempts + 1).toString());

        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => registration.unregister());
          });
        }

        if ("caches" in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }

        window.location.reload();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [shouldAutoReload]);

  // Se estamos em auto-reload e ainda não excedemos o limite
  if (shouldAutoReload) {
    const attempts = parseInt(
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem(RELOAD_KEY) || "0"
        : "0",
      10
    );

    if (attempts < MAX_RETRIES) {
      if (skeleton) {
        return <>{skeleton}</>;
      }

      const loadingBody = (
        <div className="flex items-center justify-center py-24">
          <div className="inline-flex items-center gap-3 text-sm text-[var(--bb-color-ink-muted)]">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--bb-color-accent)]" />
            <span>Atualizando...</span>
          </div>
        </div>
      );

      if (variant === "page") {
        return <B2CPage size={size}>{loadingBody}</B2CPage>;
      }
      return loadingBody;
    }
  }

  const handleReload = () => {
    sessionStorage.removeItem(RELOAD_KEY);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }

    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }

    window.location.reload();
  };

  const defaultDescription =
    "Ocorreu um erro inesperado. Tente novamente ou recarregue a página.";

  const body = (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(variant === "page" ? "py-12" : "py-8")}
    >
      <div
        className={cn(
          "bg-[var(--bb-color-surface)] rounded-2xl shadow-lg p-6 text-center max-w-md mx-auto",
          variant === "page" ? "border border-[var(--bb-color-border)]" : ""
        )}
      >
        {/* Ícone de warning */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bb-color-danger-soft)] dark:bg-red-900/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[var(--bb-color-danger)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold text-[var(--bb-color-ink)] mb-2 font-serif">
          {title}
        </h2>

        {/* Descrição */}
        <p className="text-[var(--bb-color-ink-muted)] mb-4">{description ?? defaultDescription}</p>

        {/* Detalhes do erro (apenas em dev) */}
        {isDev && errorDetails && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-[var(--bb-color-ink-muted)] hover:text-[var(--bb-color-ink)]">
              Ver detalhes do erro
            </summary>
            <pre className="mt-2 p-3 bg-[var(--bb-color-bg)] rounded-lg text-xs text-[var(--bb-color-danger)] overflow-auto max-h-40">
              {errorDetails}
            </pre>
          </details>
        )}

        {/* Botões de ação */}
        <div className="flex gap-3 justify-center">
          {secondaryAction ? (
            <SecondaryAction action={secondaryAction} />
          ) : (
            <button
              onClick={onRetry ?? handleReload}
              className="px-4 py-2 rounded-2xl border-2 border-[var(--bb-color-muted)] text-[var(--bb-color-ink)] hover:border-[var(--bb-color-accent)] hover:text-[var(--bb-color-accent)] transition-colors"
            >
              Tentar novamente
            </button>
          )}

          {primaryAction ? (
            <PrimaryAction action={primaryAction} />
          ) : (
            <button
              onClick={handleReload}
              className="px-4 py-2 rounded-2xl bg-[var(--bb-color-accent)] text-white hover:bg-[var(--bb-color-accent)]/90 transition-colors"
            >
              Recarregar página
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (variant === "page") {
    return <B2CPage size={size}>{body}</B2CPage>;
  }

  return body;
}

// =============================================================================
// EMPTY STATE
// =============================================================================

export function B2CEmptyState({
  variant = "page",
  size = "default",
  tone = "neutral",
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  variant?: B2CStateVariant;
  size?: B2CPageSize;
  tone?: B2CStateTone;
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  primaryAction?: B2CStateAction;
  secondaryAction?: B2CStateAction;
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
    return <B2CPage size={size}>{content}</B2CPage>;
  }

  return content;
}
