import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HudCardProps {
  title: string;
  value: string;
  description?: string;
  progressPercent?: number;
  progressText?: string;
  customVisual?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const HudCard = ({
  title,
  value,
  description,
  progressPercent,
  progressText,
  customVisual,
  actions,
  className,
}: HudCardProps) => (
  <section
    className={cn(
      "relative overflow-hidden rounded-2xl shadow-sm border border-orange-100/50 dark:border-stone-800 bg-gradient-to-br from-amber-50/50 via-[#fffbf6] to-orange-50/50 dark:from-[#1c1917] dark:via-[#201d1b] dark:to-[#1c1917]",
      className
    )}
  >
    <div className="relative z-10 flex items-start justify-between gap-4 p-6">
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-600/70 dark:text-orange-300/80">
          {title}
        </p>
        <h2 className="mt-1 font-serif text-3xl font-bold text-[var(--bb-color-ink)] dark:text-orange-50">
          {value}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-[var(--bb-color-ink-muted)] dark:text-stone-400">
            {description}
          </p>
        )}
      </div>
      {(progressText || typeof progressPercent === "number") && (
        <p className="text-xl font-semibold text-orange-500 dark:text-orange-300">
          {progressText || `${progressPercent}%`}
        </p>
      )}
    </div>
    
    <div className="relative z-10 px-6 pb-6">
        {customVisual && <div className="mt-2">{customVisual}</div>}
        {typeof progressPercent === "number" && (
        <div className="mt-4 h-2 rounded-full bg-orange-100 dark:bg-stone-800/50">
            <div
            className="h-full rounded-full bg-orange-400 dark:bg-orange-500"
            style={{
                width: `${progressPercent}%`,
            }}
            />
        </div>
        )}
        {actions && (
        <div className="mt-4 flex flex-wrap justify-end gap-3">
            {actions}
        </div>
        )}
    </div>

    {/* Decorative background elements */}
    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-100/20 dark:bg-orange-500/5 blur-3xl" />
    <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-amber-100/20 dark:bg-amber-500/5 blur-3xl" />
  </section>
);
