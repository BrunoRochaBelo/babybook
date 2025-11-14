import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HudCardProps {
  title: string;
  value: string;
  description?: string;
  progressPercent?: number;
  actions?: ReactNode;
  className?: string;
}

export const HudCard = ({
  title,
  value,
  description,
  progressPercent,
  actions,
  className,
}: HudCardProps) => (
  <section
    className={cn(
      "rounded-[32px] border border-border bg-surface p-6 shadow-[0_20px_50px_rgba(42,42,42,0.06)]",
      className,
    )}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
          {title}
        </p>
        <h2 className="mt-1 font-serif text-3xl text-ink">{value}</h2>
        {description && (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {typeof progressPercent === "number" && (
        <p className="text-xl font-semibold text-accent">
          {progressPercent}%
        </p>
      )}
    </div>
    {typeof progressPercent === "number" && (
      <div className="mt-4 h-2 rounded-full bg-accent-soft/60">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    )}
    {actions && (
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        {actions}
      </div>
    )}
  </section>
);
