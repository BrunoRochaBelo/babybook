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
  Bell,
  Users,
  User,
  Calendar,
  Archive,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@babybook/i18n";

export const TOUR_COMPLETED_KEY_B2B = "@babybook/partner-tour-completed";
export const TOUR_COMPLETED_KEY_B2C = "@babybook/b2c-tour-completed";

export interface TourStep {
  id: string;
  target: string; // CSS selector
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  position?: "top" | "bottom" | "left" | "right";
}

export const PARTNER_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: "[data-tour='dashboard-header']",
    titleKey: "partner.tour.welcome.title",
    descriptionKey: "partner.tour.welcome.description",
    icon: Sparkles,
  },
  {
    id: "credits",
    target: '[data-tour="credits-card"]',
    titleKey: "partner.tour.credits.title",
    descriptionKey: "partner.tour.credits.description",
    icon: CreditCard,
  },
  {
    id: "stats",
    target: '[data-tour="stats-grid"]',
    titleKey: "partner.tour.stats.title",
    descriptionKey: "partner.tour.stats.description",
    icon: BarChart3,
  },
  {
    id: "deliveries",
    target: '[data-tour="recent-deliveries"]',
    titleKey: "partner.tour.deliveries.title",
    descriptionKey: "partner.tour.deliveries.description",
    icon: Package,
  },
  {
    id: "notifications",
    target: '[data-tour="notifications-button"]',
    titleKey: "partner.tour.notifications.title",
    descriptionKey: "partner.tour.notifications.description",
    icon: Bell,
  },
  {
    id: "settings",
    target: '[data-tour="user-menu"]',
    titleKey: "partner.tour.settings.title",
    descriptionKey: "partner.tour.settings.description",
    icon: User,
  },
];

export const B2C_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: "[data-tour='b2c-header']",
    titleKey: "b2c.tour.welcome.title",
    descriptionKey: "b2c.tour.welcome.description",
    icon: Sparkles,
  },
  {
    id: "timeline",
    target: '[data-tour="moments-timeline"]',
    titleKey: "b2c.tour.timeline.title",
    descriptionKey: "b2c.tour.timeline.description",
    icon: Calendar,
  },
  {
    id: "vault",
    target: '[data-tour="vault-nav"]',
    titleKey: "b2c.tour.vault.title",
    descriptionKey: "b2c.tour.vault.description",
    icon: Archive,
  },
  {
    id: "family",
    target: '[data-tour="family-nav"]',
    titleKey: "b2c.tour.family.title",
    descriptionKey: "b2c.tour.family.description",
    icon: Users,
  },
  {
    id: "settings",
    target: '[data-tour="user-menu"]',
    titleKey: "b2c.tour.settings.title",
    descriptionKey: "b2c.tour.settings.description",
    icon: User,
  },
];

interface GuidedTourProps {
  steps: TourStep[];
  tourKey: string;
  onComplete?: () => void;
  autoStart?: boolean;
}

export function GuidedTour({
  steps,
  tourKey,
  onComplete,
  autoStart = true,
}: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const { t } = useTranslation(); // Initialize useTranslation hook

  // Determina se é B2C ou B2B para cores
  const isB2C = tourKey === TOUR_COMPLETED_KEY_B2C;
  const accentColor = isB2C ? "var(--bb-color-accent)" : "#ec4899"; // Pink-500 default for B2B

  // Verifica se já completou o tour
  useEffect(() => {
    if (!autoStart) return;

    const completed = localStorage.getItem(tourKey);
    if (completed !== "true") {
      // Delay para garantir que o DOM está pronto e animações iniciais terminaram
      const timer = setTimeout(() => setIsActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, tourKey]);

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
    localStorage.setItem(tourKey, "true");
    setIsActive(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(tourKey, "true");
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
          left: Math.max(
            padding,
            Math.min(
              targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
              window.innerWidth - tooltipWidth - padding,
            ),
          ),
          bottom: window.innerHeight - targetRect.top + padding,
        };
      case "bottom":
        return {
          left: Math.max(
            padding,
            Math.min(
              targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
              window.innerWidth - tooltipWidth - padding,
            ),
          ),
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
          className="absolute border-4 rounded-xl pointer-events-none"
          style={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderColor: accentColor,
            animation: "pulse-border-custom 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Inject custom animation if not present */}
      <style>{`
        @keyframes pulse-border-custom {
          0%, 100% {
            border-color: ${accentColor};
            box-shadow: 0 0 0 0 ${accentColor}44;
          }
          50% {
            border-color: ${accentColor}cc;
            box-shadow: 0 0 0 8px ${accentColor}00;
          }
        }
      `}</style>

      {/* Tooltip */}
      <div
        className={cn(
          "absolute w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5",
          "border border-gray-200 dark:border-gray-700",
          "animate-in fade-in-0 zoom-in-95 duration-300",
        )}
        style={tooltipStyle}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: isB2C
                ? "var(--bb-color-accent-soft)"
                : "#fdf2f8",
              color: accentColor,
            }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
              {t(step.titleKey)}
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
          {t(step.descriptionKey)}
        </p>

        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === currentStep
                  ? "w-6"
                  : idx < currentStep
                    ? "w-1.5 opacity-60"
                    : "w-1.5 bg-gray-200 dark:bg-gray-700",
              )}
              style={{
                backgroundColor: idx <= currentStep ? accentColor : undefined,
              }}
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors"
              style={{ backgroundColor: accentColor }}
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
    document.body,
  );
}

/**
 * Hook para controlar o tour manualmente
 */
export function useGuidedTour(tourKey: string = TOUR_COMPLETED_KEY_B2C) {
  const [isActive, setIsActive] = useState(false);

  const startTour = () => {
    localStorage.removeItem(tourKey);
    setIsActive(true);
  };

  const endTour = () => {
    setIsActive(false);
  };

  const resetTour = () => {
    localStorage.removeItem(tourKey);
  };

  return { isActive, startTour, endTour, resetTour };
}

export default GuidedTour;
