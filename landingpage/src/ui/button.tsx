import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style of the button.
   * - `primary` is used for the main action.
   * - `secondary` applies a secondary color scheme.
   * - `outline` draws an outline around the button.
   * - `ghost` removes most styling, useful for subtle actions.
   */
  variant?: "primary" | "secondary" | "outline" | "ghost";
  /**
   * Predefined sizes for the button.
   * - `sm` yields a small button.
   * - `md` is the default size.
   * - `lg` produces a larger button.
   */
  size?: "sm" | "md" | "lg";
}

/**
 * A reusable button component that encapsulates common styles and variants.
 * It accepts arbitrary props such as onClick, disabled, etc.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
    const variantClasses: Record<string, string> = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-2xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-300",
      outline:
        "border border-border text-foreground hover:bg-muted rounded-2xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-300",
      ghost:
        "hover:bg-muted text-foreground rounded-2xl hover:shadow-sm transform hover:-translate-y-0.5 transition-all duration-300",
    };
    const sizeClasses: Record<string, string> = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-base",
      lg: "h-12 px-6 text-base",
    };
    return (
      <button
        ref={ref}
        className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
