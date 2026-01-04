import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, Check, AlertCircle, Info, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const toastVariants = cva(
  "relative flex items-center gap-3 px-4 py-3 rounded-full shadow-lg backdrop-blur-md transition-all animate-slide-up ring-1",
  {
    variants: {
      variant: {
        default:
          "bg-white/95 dark:bg-[#2c2420]/95 border-none text-stone-800 dark:text-stone-200 ring-black/5 dark:ring-white/10",
        success:
          "bg-[#F2FBF9]/95 dark:bg-[#064e3b]/95 border-none text-[#115E59] dark:text-[#a7f3d0] ring-[#115E59]/10",
        error:
          "bg-[#FEF2F2]/95 dark:bg-[#7f1d1d]/95 border-none text-[#991B1B] dark:text-[#fecaca] ring-[#991B1B]/10",
        warning:
          "bg-[#FFFBEB]/95 dark:bg-[#78350f]/95 border-none text-[#92400E] dark:text-[#fde68a] ring-[#92400E]/10",
        info: "bg-[#EFF6FF]/95 dark:bg-[#1e3a8a]/95 border-none text-[#1E40AF] dark:text-[#bfdbfe] ring-[#1E40AF]/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: Info,
  success: Check,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
};

const iconColorMap = {
  default: "text-stone-500 dark:text-stone-400",
  success: "text-[#115E59] dark:text-[#a7f3d0]",
  error: "text-[#991B1B] dark:text-[#fecaca]",
  warning: "text-[#92400E] dark:text-[#fde68a]",
  info: "text-[#1E40AF] dark:text-[#bfdbfe]",
};

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  onClose?: () => void;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      className,
      variant = "default",
      title,
      description,
      onClose,
      icon,
      action,
      children,
      ...props
    },
    ref
  ) => {
    const Icon = iconMap[variant || "default"];

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        role="alert"
        {...props}
      >
        {/* Icon Container */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center -ml-1",
            variant === "default"
              ? "bg-stone-100 dark:bg-white/10"
              : "bg-white/60 dark:bg-black/20"
          )}
        >
          {icon || (
            <Icon
              className={cn("w-4 h-4", iconColorMap[variant || "default"])}
              strokeWidth={2.5}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {title && <p className="font-bold text-sm leading-tight">{title}</p>}
          {description && (
            <p className="text-xs font-medium opacity-90 mt-0.5 leading-tight">
              {description}
            </p>
          )}
          {children}
        </div>

        {/* Action */}
        {action && <div className="pl-2">{action}</div>}

        {/* Close button - Only show if strictly necessary or manually requested, 
            usually pills auto-dismiss so close button might be noisy. 
            Keeping it subtle. */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors -mr-1"
            aria-label="Fechar"
          >
            <X className="w-3.5 h-3.5 opacity-60" />
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = "Toast";

// Toast container for stacking multiple toasts
const ToastContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { position?: "top" | "bottom" }
>(({ className, position = "bottom", children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed z-50 flex flex-col gap-2 p-4 pointer-events-none items-center sm:items-end w-full sm:w-auto",
      position === "top" ? "top-4 left-0 right-0" : "bottom-20 left-0 right-0 sm:bottom-6 sm:right-6",
      "[&>*]:pointer-events-auto",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
ToastContainer.displayName = "ToastContainer";

export { Toast, ToastContainer, toastVariants };
