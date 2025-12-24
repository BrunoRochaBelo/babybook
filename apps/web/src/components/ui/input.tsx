import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-xl text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-pink-400 dark:focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20",
        soft: "border-[1.5px] border-gray-200/80 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-pink-400 dark:focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20",
        ghost:
          "bg-transparent border-0 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 focus:ring-2 focus:ring-pink-500/20",
        error:
          "border-2 border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20 text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
        success:
          "border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
      },
      size: {
        default: "h-10 px-3 py-2",
        sm: "h-9 px-2.5 py-1.5 text-xs",
        lg: "h-12 px-4 py-3 text-base",
        xl: "h-14 px-5 py-4 text-lg",
        // Accessible touch target (44px minimum)
        touch: "min-h-[44px] px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type, leftIcon, rightIcon, ...props }, ref) => {
    if (leftIcon || rightIcon) {
      return (
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant, size }),
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
