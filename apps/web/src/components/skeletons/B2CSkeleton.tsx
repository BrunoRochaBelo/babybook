/**
 * B2C Skeleton Component
 * 
 * Skeleton component that respects the B2C theme colors using CSS variables.
 * Use this instead of the base Skeleton for B2C pages.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export interface B2CSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation type */
  animation?: "shimmer" | "pulse" | "none";
}

export const B2CSkeleton = React.forwardRef<HTMLDivElement, B2CSkeletonProps>(
  ({ className, animation = "shimmer", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-lg",
          animation === "pulse" && "animate-pulse",
          className
        )}
        style={{ backgroundColor: "var(--bb-color-muted)" }}
        {...props}
      >
        {animation === "shimmer" && (
          <div 
            className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
            style={{
              background: "linear-gradient(to right, transparent, var(--bb-color-surface-muted), transparent)"
            }}
          />
        )}
      </div>
    );
  }
);
B2CSkeleton.displayName = "B2CSkeleton";
