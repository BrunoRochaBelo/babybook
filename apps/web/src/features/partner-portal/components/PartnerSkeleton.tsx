import { cn } from "@/lib/utils";

interface PartnerSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "card";
}

export function PartnerSkeleton({
  className,
  variant = "text",
  ...props
}: PartnerSkeletonProps) {
  const baseStyles = "animate-pulse bg-partner-surface-muted/50 rounded-lg";
  
  const variants = {
    text: "h-4 w-3/4",
    circular: "rounded-full h-10 w-10",
    rectangular: "h-24 w-full",
    card: "h-48 w-full rounded-2xl bg-partner-surface border border-partner-border shadow-sm p-4",
  };

  if (variant === "card") {
    return (
      <div className={cn(variants.card, className)} {...props}>
        <div className="flex items-center gap-4 mb-4">
          <div className="h-10 w-10 rounded-full bg-partner-surface-muted/50 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/3 bg-partner-surface-muted/50 animate-pulse rounded" />
            <div className="h-3 w-1/4 bg-partner-surface-muted/30 animate-pulse rounded" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-20 w-full bg-partner-surface-muted/30 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    />
  );
}
