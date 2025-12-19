/**
 * Partner Onboarding Component
 *
 * Card de "Primeiros Passos" exibido para novos usuários no Dashboard.
 * Mostra uma checklist visual com próximos passos recomendados.
 * Pode ser dispensado permanentemente via localStorage.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  User,
  CreditCard,
  Package,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  X,
} from "lucide-react";

const ONBOARDING_DISMISSED_KEY = "@babybook/partner-onboarding-dismissed";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof User;
  to: string;
  check: (stats: OnboardingStats) => boolean;
}

interface OnboardingStats {
  hasCompletedProfile: boolean;
  hasCredits: boolean;
  hasDeliveries: boolean;
  hasFiveDeliveries: boolean;
}

const STEPS: OnboardingStep[] = [
  {
    id: "profile",
    title: "Personalize seu estúdio",
    description: "Seus clientes verão seu nome e marca nas entregas",
    icon: User,
    to: "/partner/settings",
    check: (s) => s.hasCompletedProfile,
  },
  {
    id: "credits",
    title: "Adquira créditos",
    description: "Cada crédito = 1 entrega com voucher exclusivo",
    icon: CreditCard,
    to: "/partner/credits",
    check: (s) => s.hasCredits,
  },
  {
    id: "delivery",
    title: "Envie sua primeira entrega",
    description: "Surpreenda um cliente com fotos incríveis",
    icon: Package,
    to: "/partner/deliveries/new",
    check: (s) => s.hasDeliveries,
  },
  {
    id: "stats",
    title: "Desbloqueie estatísticas avançadas",
    description: "Complete 5 entregas para ver insights do seu negócio",
    icon: BarChart3,
    to: "/partner",
    check: (s) => s.hasFiveDeliveries,
  },
];

interface PartnerOnboardingProps {
  stats: OnboardingStats;
}

export function PartnerOnboarding({ stats }: PartnerOnboardingProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
    setIsLoaded(true);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
  };

  const completedCount = STEPS.filter((step) => step.check(stats)).length;
  const progress = (completedCount / STEPS.length) * 100;
  const isComplete = completedCount === STEPS.length;

  // Não renderiza enquanto carrega ou se foi dispensado
  if (!isLoaded || isDismissed) return null;

  // Não mostra se já completou todos os passos
  if (isComplete) return null;

  return (
    <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-2xl border border-pink-100 dark:border-pink-900/50 p-6 mb-6 animate-in fade-in-0 slide-in-from-top-2 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Vamos começar! 🚀
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Siga estes passos para entregar suas primeiras fotos
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
          title="Dispensar guia de primeiros passos"
          aria-label="Dispensar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-600 dark:text-gray-400">
            {completedCount === 0 
              ? "Pronto para começar?" 
              : completedCount === STEPS.length - 1 
                ? "Quase lá!" 
                : "Continue assim!"}
          </span>
          <span className="font-medium text-pink-600 dark:text-pink-400">
            {completedCount}/{STEPS.length} etapas
          </span>
        </div>
        <div className="h-2 bg-white dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step) => {
          const isCompleted = step.check(stats);
          const Icon = step.icon;

          return (
            <Link
              key={step.id}
              to={step.to}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isCompleted
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50"
                  : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-800 hover:shadow-sm"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isCompleted
                      ? "text-green-700 dark:text-green-300 line-through"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {step.title}
                </p>
                <p
                  className={`text-xs ${
                    isCompleted
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step.description}
                </p>
              </div>
              {!isCompleted && (
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default PartnerOnboarding;
