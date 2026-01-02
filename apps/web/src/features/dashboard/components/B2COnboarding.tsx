
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
  const progress = (completedCount / STEPS.length) * 100;
  const isComplete = completedCount === STEPS.length;

  if (!isLoaded || isDismissed || isComplete) return null;

  return (
    <div 
      className="rounded-3xl border p-6 mb-8 animate-in fade-in-0 slide-in-from-top-2 duration-500 shadow-sm"
      style={{
        background: "var(--bb-color-accent-soft)",
        borderColor: "var(--bb-color-border)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: "var(--bb-color-accent)" }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--bb-color-ink)" }}>
              {t("b2c.onboarding.title")} ✨
            </h3>
            <p className="text-sm opacity-80" style={{ color: "var(--bb-color-ink)" }}>
              {t("b2c.onboarding.subtitle")}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: "var(--bb-color-ink-subtle)" }}
          title={t("common.dismiss")}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2 font-medium">
          <span style={{ color: "var(--bb-color-ink-muted)" }}>
            {completedCount === 0 
              ? t("b2c.onboarding.progress.start")
              : completedCount === STEPS.length - 1 
                ? t("b2c.onboarding.progress.almost")
                : t("b2c.onboarding.progress.continue")}
          </span>
          <span style={{ color: "var(--bb-color-accent)" }}>
            {completedCount}/{STEPS.length}
          </span>
        </div>
        <div 
          className="h-2.5 rounded-full overflow-hidden p-0.5 border"
          style={{ 
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            borderColor: "rgba(0, 0, 0, 0.05)"
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ 
              width: `${progress}%`,
              background: "var(--bb-color-accent)"
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="grid sm:grid-cols-2 gap-3">
        {STEPS.map((step) => {
          const isCompleted = step.check(stats);
          const Icon = step.icon;

          return (
            <Link
              key={step.id}
              to={step.to}
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all border ${
                isCompleted ? "opacity-75" : "hover:shadow-md active:scale-[0.98]"
              }`}
              style={{
                backgroundColor: isCompleted ? "var(--bb-color-success-soft)" : "var(--bb-color-surface)",
                borderColor: isCompleted ? "var(--bb-color-success)" : "var(--bb-color-border)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{
                  backgroundColor: isCompleted ? "var(--bb-color-surface)" : "var(--bb-color-accent-soft)",
                  color: isCompleted ? "var(--bb-color-success)" : "var(--bb-color-accent)",
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold ${isCompleted ? "line-through" : ""}`}
                  style={{ color: isCompleted ? "var(--bb-color-success)" : "var(--bb-color-ink)" }}
                >
                  {t(step.titleKey)}
                </p>
                <p
                  className="text-xs"
                  style={{ color: isCompleted ? "var(--bb-color-success)" : "var(--bb-color-ink-muted)", opacity: isCompleted ? 0.7 : 1 }}
                >
                  {t(step.descriptionKey)}
                </p>
              </div>
              {!isCompleted && (
                <ChevronRight 
                  className="w-5 h-5 flex-shrink-0" 
                  style={{ color: "var(--bb-color-border-strong)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
