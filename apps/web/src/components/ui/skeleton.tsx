import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const skeletonVariants = cva(
  "relative overflow-hidden bg-gray-200 dark:bg-gray-700",
  {
    variants: {
      variant: {
        default: "rounded-lg",
        circular: "rounded-full",
        text: "rounded h-4",
        title: "rounded h-6 w-3/4",
        paragraph: "rounded h-4 w-full",
        avatar: "rounded-full w-10 h-10",
        thumbnail: "rounded-xl w-full aspect-video",
        card: "rounded-xl",
      },
      animation: {
        shimmer: "",
        pulse: "animate-pulse",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animation: "shimmer",
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /** Width of the skeleton (can be number in px or string like '100%') */
  width?: number | string;
  /** Height of the skeleton (can be number in px or string like '2rem') */
  height?: number | string;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, animation, width, height, style, ...props }, ref) => {
    const computedStyle: React.CSSProperties = {
      ...style,
      width: typeof width === "number" ? `${width}px` : width,
      height: typeof height === "number" ? `${height}px` : height,
    };

    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, animation }), className)}
        style={computedStyle}
        {...props}
      >
        {animation === "shimmer" && (
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
        )}
      </div>
    );
  }
);
Skeleton.displayName = "Skeleton";

// Preset skeleton compositions
const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="paragraph"
        style={{ width: i === lines - 1 ? "60%" : "100%" }}
      />
    ))}
  </div>
);

const SkeletonCard = () => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
    <Skeleton variant="thumbnail" />
    <Skeleton variant="title" />
    <SkeletonText lines={2} />
  </div>
);

const SkeletonAvatar = ({ size = 40 }: { size?: number }) => (
  <Skeleton variant="circular" width={size} height={size} />
);

const SkeletonRow = () => (
  <div className="flex items-center gap-3">
    <SkeletonAvatar />
    <div className="flex-1 space-y-2">
      <Skeleton height={14} width="40%" />
      <Skeleton height={12} width="70%" />
    </div>
  </div>
);

export { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar, SkeletonRow, skeletonVariants };
