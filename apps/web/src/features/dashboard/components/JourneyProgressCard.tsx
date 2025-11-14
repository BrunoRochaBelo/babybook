import React from "react";
import { TOTAL_GUIDED_MOMENTS } from "@/data/momentCatalog";

interface JourneyProgressCardProps {
  completed: number;
}

export const JourneyProgressCard = ({ completed }: JourneyProgressCardProps) => {
  const percentage = Math.min(
    100,
    Math.round((completed / TOTAL_GUIDED_MOMENTS) * 100),
  );

  return (
    <section className="mb-8 rounded-[32px] border border-border bg-surface p-6 shadow-[0_20px_50px_rgba(42,42,42,0.06)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            Progresso geral
          </p>
          <h2 className="mt-1 font-serif text-2xl text-ink">
            {completed} de {TOTAL_GUIDED_MOMENTS} momentos registrados
          </h2>
        </div>
        <p className="text-xl font-semibold text-accent">{percentage}%</p>
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-accent-soft/60">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </section>
  );
};
