/**
 * Partner Stepper Component
 *
 * Componente visual de progresso reutilizável para fluxos do portal (Cadastro, Criação de Entrega).
 */

import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: number | string;
  title: string;
  icon?: LucideIcon;
}

interface PartnerStepperProps {
  steps: readonly StepItem[];
  currentStep: number | string;
  className?: string;
}

export function PartnerStepper({
  steps,
  currentStep,
  className,
}: PartnerStepperProps) {
  // Encontrar índex atual para cálculo da barra de progresso
  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  // Se não achar (ex: string mismatch), assume 0 ou trata como quiser.
  // Aqui vamos assumir que currentStep bate com s.id
  // Mas para flexibilidade, se `currentStep` for number e `s.id` number, ok.

  // Normalizar para índice numérico para a barra de progresso
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  const progressPercent = (activeIndex / (steps.length - 1)) * 100;

  return (
    <div className={cn("px-4", className)}>
      {/* Progress bar and circles */}
      <div className="relative flex items-center justify-between max-w-xs mx-auto">
        {/* Background line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 dark:bg-gray-700/50 rounded-full" />

        {/* Progress line (animated) */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(Math.max(progressPercent, 0), 100)}%`,
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isCurrent = index === activeIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="relative z-10 group">
              {/* Step circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ease-out border-4",
                  isCompleted
                    ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white border-white dark:border-gray-800 shadow-lg shadow-pink-500/30 scale-100"
                    : isCurrent
                      ? "bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900 ring-2 ring-pink-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110"
                      : "bg-white dark:bg-gray-800 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-700",
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : StepIcon ? (
                  <StepIcon className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>

              {/* Step label - hidden on mobile small, visible on active/larger */}
              <span
                className={cn(
                  "absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 pointer-events-none",
                  isCurrent
                    ? "text-pink-600 dark:text-pink-400 translate-y-0 opacity-100"
                    : "text-gray-400 dark:text-gray-500 translate-y-1 opacity-0 sm:opacity-70",
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
