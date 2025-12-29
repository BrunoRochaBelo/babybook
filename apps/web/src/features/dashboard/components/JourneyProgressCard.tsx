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
    <section
      className="mb-8 rounded-[32px] border p-6"
      style={{
        backgroundColor: "var(--bb-color-surface)",
        borderColor: "var(--bb-color-border)",
        boxShadow: "0 20px 50px rgba(42,42,42,0.06)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            Progresso geral
          </p>
          <h2
            className="mt-1 font-serif text-2xl"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {completed} de {TOTAL_GUIDED_MOMENTS} momentos registrados
          </h2>
        </div>
        <p
          className="text-xl font-semibold"
          style={{ color: "var(--bb-color-accent)" }}
        >
          {percentage}%
        </p>
      </div>
      <div
        className="mt-4 h-3 w-full rounded-full"
        style={{ backgroundColor: "var(--bb-color-muted)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            backgroundColor: "var(--bb-color-accent)",
            width: `${percentage}%`,
            boxShadow: "0 2px 8px rgba(244, 164, 107, 0.3)",
          }}
        />
      </div>
    </section>
  );
};
