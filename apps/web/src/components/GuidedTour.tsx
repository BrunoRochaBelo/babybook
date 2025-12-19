/**
 * Guided Tour Component
 * 
 * Tour guiado interativo que destaca elementos da interface
 * para novos usuários, explicando cada funcionalidade.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CreditCard,
  Package,
  BarChart3,
  Settings,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOUR_COMPLETED_KEY = "@babybook/partner-tour-completed";

export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  description: string;
  icon?: typeof CreditCard;
  position?: "top" | "bottom" | "left" | "right";
}

const DEFAULT_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: "[data-tour='dashboard-header']",
    title: "Bem-vindo ao Portal do Parceiro!",
    description: "Este é o seu painel principal. Aqui você acompanha entregas, créditos e estatísticas do seu estúdio.",
    icon: Sparkles,
    position: "bottom",
  },
  {
    id: "credits",
    target: "[data-tour='credits-card']",
    title: "Seus Créditos",
    description: "Créditos são usados para gerar vouchers. Compre pacotes e envie fotos aos seus clientes.",
    icon: CreditCard,
    position: "bottom",
  },
  {
    id: "stats",
    target: "[data-tour='stats-grid']",
    title: "Estatísticas",
    description: "Acompanhe o número de entregas, vouchers gerados e resgates em tempo real.",
    icon: BarChart3,
    position: "top",
  },
  {
    id: "deliveries",
    target: "[data-tour='recent-deliveries']",
    title: "Entregas Recentes",
    description: "Veja suas últimas entregas e acompanhe o status de cada uma.",
    icon: Package,
    position: "top",
  },
  {
    id: "notifications",
    target: "[data-tour='notifications-button']",
    title: "Notificações",
    description: "Fique por dentro de novos resgates e atualizações importantes.",
    icon: Bell,
    position: "bottom",
  },
  {
    id: "settings",
    target: "[data-tour='user-menu']",
    title: "Menu do Usuário",
    description: "Acesse configurações, altere o tema e gerencie sua conta.",
    icon: Settings,
    position: "bottom",
  },
];

interface GuidedTourProps {
  steps?: TourStep[];
  onComplete?: () => void;
  autoStart?: boolean;
}

export function GuidedTour({
  steps = DEFAULT_STEPS,
  onComplete,
  autoStart = true,
}: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Verifica se já completou o tour
  useEffect(() => {
    if (!autoStart) return;
    
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (completed !== "true") {
      // Delay para garantir que o DOM está pronto
      const timer = setTimeout(() => setIsActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  // Atualiza posição do elemento alvo
  const updateTargetRect = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [currentStep, steps]);

  useEffect(() => {
    if (!isActive) return;
    
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);
    
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [isActive, updateTargetRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
    setIsActive(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
    setIsActive(false);
  };

  const step = steps[currentStep];
  const Icon = step?.icon || Sparkles;

  // Calcula posição do tooltip
  const tooltipStyle = useMemo(() => {
    if (!targetRect) return {};

    const padding = 16;
    const tooltipWidth = 320;
    const position = step?.position || "bottom";

    switch (position) {
      case "top":
        return {
          left: Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
          bottom: window.innerHeight - targetRect.top + padding,
        };
      case "bottom":
        return {
          left: Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
          top: targetRect.bottom + padding,
        };
      case "left":
        return {
          right: window.innerWidth - targetRect.left + padding,
          top: targetRect.top + targetRect.height / 2 - 80,
        };
      case "right":
        return {
          left: targetRect.right + padding,
          top: targetRect.top + targetRect.height / 2 - 80,
        };
      default:
        return {};
    }
  }, [targetRect, step?.position]);

  if (!isActive || !step) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Overlays escuros ao redor do elemento - sem blur */}
      {targetRect ? (
        <>
          {/* Top overlay */}
          <div
            className="absolute bg-black/70 transition-all duration-300"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: Math.max(0, targetRect.top - 8),
            }}
            onClick={handleSkip}
          />
          {/* Bottom overlay */}
          <div
            className="absolute bg-black/70 transition-all duration-300"
            style={{
              top: targetRect.bottom + 8,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onClick={handleSkip}
          />
          {/* Left overlay */}
          <div
            className="absolute bg-black/70 transition-all duration-300"
            style={{
              top: Math.max(0, targetRect.top - 8),
              left: 0,
              width: Math.max(0, targetRect.left - 8),
              height: targetRect.height + 16,
            }}
            onClick={handleSkip}
          />
          {/* Right overlay */}
          <div
            className="absolute bg-black/70 transition-all duration-300"
            style={{
              top: Math.max(0, targetRect.top - 8),
              right: 0,
              left: targetRect.right + 8,
              height: targetRect.height + 16,
            }}
            onClick={handleSkip}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-black/70 transition-opacity duration-300"
          onClick={handleSkip}
        />
      )}

      {/* Highlight do elemento - borda animada */}
      {targetRect && (
        <div
          className="absolute border-4 border-pink-500 rounded-xl pointer-events-none"
          style={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            animation: "pulse-border 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={cn(
          "absolute w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5",
          "border border-gray-200 dark:border-gray-700",
          "animate-in fade-in-0 zoom-in-95 duration-300"
        )}
        style={tooltipStyle}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
              {step.title}
            </h3>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Pular tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {step.description}
        </p>

        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === currentStep
                  ? "w-6 bg-pink-500"
                  : idx < currentStep
                    ? "w-1.5 bg-pink-300 dark:bg-pink-700"
                    : "w-1.5 bg-gray-200 dark:bg-gray-700"
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Pular tour
          </button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink-500 text-white text-sm font-medium rounded-lg hover:bg-pink-600 transition-colors"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                "Concluir"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Hook para controlar o tour manualmente
 */
export function useGuidedTour() {
  const [isActive, setIsActive] = useState(false);

  const startTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    setIsActive(true);
  };

  const endTour = () => {
    setIsActive(false);
  };

  const resetTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
  };

  return { isActive, startTour, endTour, resetTour };
}

export default GuidedTour;
