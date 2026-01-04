/**
 * Input Validation Component
 *
 * Campo de input com validação em tempo real que mostra ícone de sucesso/erro
 * e mensagem de validação enquanto o usuário digita.
 */

import { useState, useEffect, useMemo } from "react";
import { Check, X, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ValidationStatus = "idle" | "validating" | "valid" | "invalid";

export interface ValidationRule {
  test: (value: string) => boolean | Promise<boolean>;
  message: string;
}

interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  rules?: ValidationRule[];
  showValidation?: boolean;
  validateOnBlur?: boolean;
  validateDelay?: number;
  helperText?: string;
  /** Mensagem de erro vinda de validação externa (ex.: react-hook-form). */
  error?: string;
  containerClassName?: string;
  icon?: React.ElementType; // Icon component
  rightElement?: React.ReactNode; // Element to render on the right side (e.g. password toggle)
  multiline?: boolean;
  rows?: number;
}

export function ValidatedInput({
  value,
  onChange,
  label,
  rules = [],
  showValidation = true,
  validateOnBlur = false,
  validateDelay = 500,
  helperText,
  error,
  containerClassName,
  className,
  id,
  icon: Icon,
  rightElement,
  ...props
}: ValidatedInputProps) {
  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Validação em tempo real com debounce
  useEffect(() => {
    if (!showValidation || rules.length === 0) return;
    if (!touched && validateOnBlur) return;
    if (!value) {
      setStatus("idle");
      setErrorMessage(null);
      return;
    }

    setStatus("validating");

    const timer = setTimeout(async () => {
      try {
        for (const rule of rules) {
          const result = await rule.test(value);
          if (!result) {
            setStatus("invalid");
            setErrorMessage(rule.message);
            return;
          }
        }
        setStatus("valid");
        setErrorMessage(null);
      } catch {
        setStatus("invalid");
        setErrorMessage("Erro ao validar");
      }
    }, validateDelay);

    return () => clearTimeout(timer);
  }, [value, rules, showValidation, touched, validateOnBlur, validateDelay]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    props.onBlur?.(e);
  };

  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  const hasExternalError = Boolean(error);
  const effectiveStatus: ValidationStatus = hasExternalError
    ? "invalid"
    : status;
  const effectiveErrorMessage = error ?? errorMessage;

  const statusIcon = useMemo(() => {
    if (!showValidation || !value) return null;

    switch (effectiveStatus) {
      case "validating":
        return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
      case "valid":
      case "valid":
        return (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200"
            style={{ backgroundColor: "var(--bb-color-success)" }}
          >
            <Check className="w-3 h-3 text-white" />
          </div>
        );
      case "invalid":
        return (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200"
            style={{ backgroundColor: "var(--bb-color-danger)" }}
          >
            <X className="w-3 h-3 text-white" />
          </div>
        );
      default:
        return null;
    }
  }, [effectiveStatus, value, showValidation]);

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}
        {props.multiline ? (
          <textarea
            id={inputId}
            value={value}
            onChange={onChange as any} // textarea onChange is compatible
            onBlur={handleBlur}
            className={cn(
              "w-full py-3 border rounded-xl transition-all outline-none resize-none",
              Icon ? "pl-12 pr-4" : "px-4",
              "focus:ring-2 focus:ring-[var(--bb-color-accent)]/20 focus:border-[var(--bb-color-accent)]",
              (showValidation && value) || rightElement ? "pr-12" : "",
              rightElement && (showValidation && value) ? "pr-20" : "",
              className,
            )}
            style={{
              backgroundColor: "var(--bb-color-surface)",
              color: "var(--bb-color-ink)",
              borderColor:
                effectiveStatus === "invalid"
                  ? "var(--bb-color-danger)"
                  : effectiveStatus === "valid"
                  ? "var(--bb-color-success)"
                  : "var(--bb-color-border-strong)",
            }}
            {...(props as any)}
          />
        ) : (
          <input
            id={inputId}
            value={value}
            onChange={onChange}
            onBlur={handleBlur}
            className={cn(
              "w-full py-3 border rounded-xl transition-all outline-none",
              Icon ? "pl-12 pr-4" : "px-4",
              "focus:ring-2 focus:ring-[var(--bb-color-accent)]/20 focus:border-[var(--bb-color-accent)]",
              (showValidation && value) || rightElement ? "pr-12" : "",
              rightElement && (showValidation && value) ? "pr-20" : "",
              className,
            )}
            style={{
              backgroundColor: "var(--bb-color-surface)",
              color: "var(--bb-color-ink)",
              borderColor:
                effectiveStatus === "invalid"
                  ? "var(--bb-color-danger)"
                  : effectiveStatus === "valid"
                  ? "var(--bb-color-success)"
                  : "var(--bb-color-border-strong)",
            }}
            {...props}
          />
        )}
        {(statusIcon || rightElement) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
             {rightElement}
             {statusIcon}
          </div>
        )}
      </div>

      {/* Mensagem de erro ou helper text */}
      {effectiveErrorMessage && effectiveStatus === "invalid" && (
        <p
          className="mt-1.5 text-xs flex items-center gap-1 animate-in fade-in-0 slide-in-from-top-1 duration-200"
          style={{ color: "var(--bb-color-danger)" }}
        >
          <AlertCircle className="w-3 h-3" />
          {effectiveErrorMessage}
        </p>
      )}
      {helperText && effectiveStatus !== "invalid" && (
        <p
          className="mt-1.5 text-xs"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

// Regras de validação pré-definidas
export const validationRules = {
  email: {
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: "Informe um e-mail válido",
  },
  required: (fieldName: string) => ({
    test: (value: string) => value.trim().length > 0,
    message: `${fieldName} é obrigatório`,
  }),
  minLength: (min: number) => ({
    test: (value: string) => value.length >= min,
    message: `Mínimo de ${min} caracteres`,
  }),
  maxLength: (max: number) => ({
    test: (value: string) => value.length <= max,
    message: `Máximo de ${max} caracteres`,
  }),
};

export default ValidatedInput;
