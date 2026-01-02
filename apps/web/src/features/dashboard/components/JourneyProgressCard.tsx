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
      className="mb-8 relative overflow-hidden rounded-2xl shadow-sm border border-orange-100/50 dark:border-stone-800 bg-gradient-to-br from-amber-50/50 via-[#fffbf6] to-orange-50/50 dark:from-[#1c1917] dark:via-[#201d1b] dark:to-[#1c1917]"
    >
      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between">
            <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-600/70 dark:text-orange-300/80">
                Progresso geral
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-[var(--bb-color-ink)] dark:text-orange-50">
                {completed} de {TOTAL_GUIDED_MOMENTS} momentos registrados
            </h2>
            </div>
            <p className="text-xl font-semibold text-orange-500 dark:text-orange-300">
            {percentage}%
            </p>
        </div>
        <div className="mt-4 h-3 w-full rounded-full bg-orange-100 dark:bg-stone-800/50">
            <div
            className="h-full rounded-full transition-all bg-orange-400 dark:bg-orange-500"
            style={{
                width: `${percentage}%`,
                boxShadow: "0 2px 8px rgba(251, 146, 60, 0.2)",
            }}
            />
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-100/20 dark:bg-orange-500/5 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-amber-100/20 dark:bg-amber-500/5 blur-3xl" />
    </section>
  );
};
