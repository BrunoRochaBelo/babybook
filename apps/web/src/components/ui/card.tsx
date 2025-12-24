import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
        soft: "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80",
        elevated:
          "bg-white dark:bg-gray-800 shadow-md dark:shadow-xl border-0",
        gradient:
          "bg-gradient-to-br from-pink-500 to-rose-500 text-white border-0 shadow-lg",
        ghost: "bg-transparent border-0",
        outlined:
          "bg-transparent border-2 border-gray-200 dark:border-gray-700",
      },
      padding: {
        none: "",
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1 hover:shadow-lg cursor-pointer",
        glow: "hover:shadow-lg hover:shadow-pink-500/10 hover:border-pink-300 dark:hover:border-pink-700 cursor-pointer",
        scale: "hover:scale-[1.02] cursor-pointer",
        border: "hover:border-pink-400 dark:hover:border-pink-500 cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      hover: "none",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, hover }), className)}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

// Card subcomponents for structured layouts
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold text-gray-900 dark:text-white", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};
