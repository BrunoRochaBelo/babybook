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
    className={cn("rounded-[32px] border p-6", className)}
    style={{
      backgroundColor: "var(--bb-color-surface)",
      borderColor: "var(--bb-color-border)",
      boxShadow: "0 20px 50px rgba(42,42,42,0.06)",
    }}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p
          className="text-xs uppercase tracking-[0.3em]"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          {title}
        </p>
        <h2
          className="mt-1 font-serif text-3xl"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {value}
        </h2>
        {description && (
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            {description}
          </p>
        )}
      </div>
      {typeof progressPercent === "number" && (
        <p
          className="text-xl font-semibold"
          style={{ color: "var(--bb-color-accent)" }}
        >
          {progressPercent}%
        </p>
      )}
    </div>
    {typeof progressPercent === "number" && (
      <div
        className="mt-4 h-2 rounded-full"
        style={{ backgroundColor: "var(--bb-color-accent-soft)", opacity: 0.6 }}
      >
        <div
          className="h-full rounded-full"
          style={{
            backgroundColor: "var(--bb-color-accent)",
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
  </section>
);
