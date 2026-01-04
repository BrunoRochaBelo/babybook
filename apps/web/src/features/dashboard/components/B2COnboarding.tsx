
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Baby,
  Camera,
  Shield,
  Users,
  CheckCircle2,
  ChevronRight,
  X,
} from "lucide-react";
import { useTranslation } from "@babybook/i18n";

const ONBOARDING_DISMISSED_KEY = "@babybook/b2c-onboarding-dismissed";

interface OnboardingStep {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: typeof Baby;
  to: string;
  check: (stats: OnboardingStats) => boolean;
}

export interface OnboardingStats {
  hasCompletedProfile: boolean;
  hasMoments: boolean;
  hasVaultFiles: boolean;
  hasFamilyMembers: boolean;
}

const STEPS: OnboardingStep[] = [
  {
    id: "profile",
    titleKey: "b2c.onboarding.steps.profile.title",
    descriptionKey: "b2c.onboarding.steps.profile.description",
    icon: Baby,
    to: "/jornada/perfil-crianca",
    check: (s) => s.hasCompletedProfile,
  },
  {
    id: "moment",
    titleKey: "b2c.onboarding.steps.moment.title",
    descriptionKey: "b2c.onboarding.steps.moment.description",
    icon: Camera,
    to: "/app/novo-momento",
    check: (s) => s.hasMoments,
  },
  {
    id: "vault",
    titleKey: "b2c.onboarding.steps.vault.title",
    descriptionKey: "b2c.onboarding.steps.vault.description",
    icon: Shield,
    to: "/cofre",
    check: (s) => s.hasVaultFiles,
  },
  {
    id: "family",
    titleKey: "b2c.onboarding.steps.family.title",
    descriptionKey: "b2c.onboarding.steps.family.description",
    icon: Users,
    to: "/jornada/familia",
    check: (s) => s.hasFamilyMembers,
  },
];

interface B2COnboardingProps {
  stats: OnboardingStats;
}

export function B2COnboarding({ stats }: B2COnboardingProps) {
  const { t } = useTranslation();
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
  // const progress = (completedCount / STEPS.length) * 100; // Not used in new design for cleaner look
  const isComplete = completedCount === STEPS.length;

  if (!isLoaded || isDismissed || isComplete) return null;

  return (
    <div
      className="relative mb-12 overflow-hidden rounded-[2.5rem] p-8 shadow-sm transition-all hover:shadow-md group"
      style={{
        background: "linear-gradient(135deg, var(--bb-color-surface) 0%, var(--bb-color-bg) 100%)",
        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(0,0,0,0.03)",
      }}
    >
      {/* Decorative Blur */}
      <div 
        className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20"
        style={{ background: "var(--bb-color-accent)" }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between mb-8">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm"
               style={{ 
                 borderColor: "var(--bb-color-border)",
                 color: "var(--bb-color-accent)"
               }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Comece por aqui</span>
          </div>
          <h3 className="font-serif text-2xl font-medium leading-tight" style={{ color: "var(--bb-color-ink)" }}>
            Vamos, criar o livro da vida? ✨
          </h3>
          <p className="mt-2 text-base opacity-70 max-w-md leading-relaxed" style={{ color: "var(--bb-color-ink)" }}>
            Complete estes passos essenciais para deixar a linha do tempo do seu bebê mais rica e segura.
          </p>
        </div>
        
        <button
          onClick={handleDismiss}
          className="rounded-full p-2 transition-colors hover:bg-black/5 active:scale-95"
          style={{ color: "var(--bb-color-ink-muted)" }}
          title={t("common.dismiss")}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Steps Grid */}
      <div className="relative z-10 grid gap-4 sm:grid-cols-2">
        {STEPS.map((step) => {
          const isCompleted = step.check(stats);
          const Icon = step.icon;

          return (
            <Link
              key={step.id}
              to={step.to}
              className={`flex items-center gap-5 rounded-[1.5rem] p-4 transition-all duration-300 ${
                isCompleted 
                  ? "opacity-60 grayscale-[0.5]" 
                  : "bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
              }`}
              style={{
                // border: "1px solid rgba(0,0,0,0.03)" 
              }}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-colors ${
                  isCompleted ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-white dark:bg-white/10 text-[var(--bb-color-accent)]"
                }`}
                style={{
                  boxShadow: isCompleted ? "none" : "0 4px 12px rgba(0,0,0,0.06)"
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <p
                  className={`font-semibold ${isCompleted ? "line-through opacity-80" : ""}`}
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  {t(step.titleKey)}
                </p>
                <p
                  className="truncate text-sm opacity-70"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  {t(step.descriptionKey)}
                </p>
              </div>

              {!isCompleted && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 shadow-sm">
                   <ChevronRight className="w-4 h-4 text-[var(--bb-color-ink-muted)]" />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
