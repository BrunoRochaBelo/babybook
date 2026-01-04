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
  variant = "transparent",
  className,
}: {
  children: ReactNode;
  size?: PartnerPageSize;
  variant?: "transparent" | "card";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full mx-auto px-4 py-6 sm:py-8",
        sizeClass[size],
        variant === "card" && "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] shadow-lg border border-white/50 dark:border-gray-700/50 p-6 sm:p-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
