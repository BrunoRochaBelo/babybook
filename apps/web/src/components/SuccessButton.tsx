/**
 * Success Button Component
 * 
 * Botão com animação de sucesso que mostra um check animado após ação bem-sucedida.
 * Pode ser usado para qualquer botão de ação que precisa de feedback visual.
 */

import { useState, useEffect, ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonState = "idle" | "loading" | "success";

interface SuccessButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  isSuccess?: boolean;
  loadingText?: string;
  successText?: string;
  successDuration?: number;
  onSuccessEnd?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
}

export function SuccessButton({
  children,
  isLoading = false,
  isSuccess = false,
  loadingText = "Processando...",
  successText = "Concluído!",
  successDuration = 2000,
  onSuccessEnd,
  variant = "primary",
  size = "md",
  icon,
  className,
  disabled,
  ...props
}: SuccessButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");
  const [showSuccessContent, setShowSuccessContent] = useState(false);

  // Controla o estado com base nas props
  useEffect(() => {
    if (isLoading) {
      setState("loading");
      setShowSuccessContent(false);
    } else if (isSuccess) {
      setState("success");
      setShowSuccessContent(true);
      
      const timer = setTimeout(() => {
        setState("idle");
        setShowSuccessContent(false);
        onSuccessEnd?.();
      }, successDuration);
      
      return () => clearTimeout(timer);
    } else {
      setState("idle");
    }
  }, [isLoading, isSuccess, successDuration, onSuccessEnd]);

  const variantStyles = {
    primary: cn(
      "bg-pink-500 text-white hover:bg-pink-600",
      state === "success" && "bg-green-500 hover:bg-green-500"
    ),
    secondary: cn(
      "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700",
      state === "success" && "bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300"
    ),
    ghost: cn(
      "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700",
      state === "success" && "text-green-600 dark:text-green-400"
    ),
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-xl transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
        variantStyles[variant],
        sizeStyles[size],
        state === "success" && "animate-in zoom-in-95 duration-200",
        className
      )}
      disabled={disabled || state === "loading"}
      {...props}
    >
      {state === "loading" ? (
        <>
          <Loader2 className={cn(
            "animate-spin",
            size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4"
          )} />
          <span>{loadingText}</span>
        </>
      ) : state === "success" && showSuccessContent ? (
        <>
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-white/30" />
            <Check className={cn(
              size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4"
            )} />
          </div>
          <span>{successText}</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}

/**
 * Hook para gerenciar estado de sucesso de botão
 */
export function useSuccessButton(successDuration = 2000) {
  const [isSuccess, setIsSuccess] = useState(false);

  const triggerSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), successDuration);
  };

  return { isSuccess, triggerSuccess };
}

export default SuccessButton;
