import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

const toastVariants = cva(
  "relative flex items-start gap-3 p-4 rounded-xl shadow-lg backdrop-blur-sm transition-all animate-slide-up",
  {
    variants: {
      variant: {
        default:
          "bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white",
        success:
          "bg-emerald-50/95 dark:bg-emerald-950/95 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200",
        error:
          "bg-red-50/95 dark:bg-red-950/95 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
        warning:
          "bg-amber-50/95 dark:bg-amber-950/95 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
        info: "bg-blue-50/95 dark:bg-blue-950/95 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconColorMap = {
  default: "text-gray-500 dark:text-gray-400",
  success: "text-emerald-500 dark:text-emerald-400",
  error: "text-red-500 dark:text-red-400",
  warning: "text-amber-500 dark:text-amber-400",
  info: "text-blue-500 dark:text-blue-400",
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
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {icon || <Icon className={cn("w-5 h-5", iconColorMap[variant || "default"])} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-medium text-sm">{title}</p>
          )}
          {description && (
            <p className="text-sm opacity-80 mt-0.5">{description}</p>
          )}
          {children}
          {action && <div className="mt-2">{action}</div>}
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all touch-target"
            aria-label="Fechar notificação"
          >
            <X className="w-4 h-4" />
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
      "fixed z-50 flex flex-col gap-2 p-4 pointer-events-none",
      position === "top" ? "top-0 left-0 right-0" : "bottom-0 left-0 right-0",
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
