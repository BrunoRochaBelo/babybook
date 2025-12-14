import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PartnerPageSize = "narrow" | "default" | "wide";

const sizeClass: Record<PartnerPageSize, string> = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-6xl",
};

export function PartnerPage({
  children,
  size = "default",
  className,
}: {
  children: ReactNode;
  size?: PartnerPageSize;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full mx-auto px-4 py-6 sm:py-8",
        sizeClass[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
