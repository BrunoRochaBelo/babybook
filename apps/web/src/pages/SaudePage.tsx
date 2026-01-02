import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Stethoscope,
  Syringe,
  FolderLock,
  Shield,
  Baby,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useAuthStore } from "@/store/auth";
import { HealthGrowthTab } from "@/components/HealthGrowthTab";
import { HealthPediatrianTab } from "@/components/HealthPediatrianTab";
import { HealthVaccinesTab } from "@/components/HealthVaccinesTab";
import { useLogout } from "@/hooks/api";
import { B2CLoadingState, B2CEmptyState, B2CPage } from "@/layouts/b2cStates";

type HealthTab = "crescimento" | "pediatra" | "vacinas";

const HEALTH_TABS: Array<{
  id: HealthTab;
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}> = [
  {
    id: "crescimento",
    label: "Crescimento",
    description: "Curva e medições oficiais",
    icon: Activity,
  },
  {
    id: "pediatra",
    label: "Pediatra",
    description: "Consultas e receituário",
    icon: Stethoscope,
  },
  {
    id: "vacinas",
    label: "Vacinas",
    description: "Cartão atualizado",
    icon: Syringe,
  },
];

const REAUTH_TIMEOUT_MS = 5 * 60 * 1000;

export const SaudePage = () => {
  const [activeTab, setActiveTab] = useState<HealthTab>("crescimento");
  const { selectedChild } = useSelectedChild();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.logout);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const logoutMutation = useLogout();
  const [reauthRequired, setReauthRequired] = useState(false);
  const timerRef = useRef<number | null>(null);
  const enableMocksFlag = (
    import.meta.env.VITE_ENABLE_MSW ??
    (import.meta.env.DEV || import.meta.env.MODE === "test" ? "true" : "false")
  )
    .toString()
    .toLowerCase();
  const isMockMode =
    enableMocksFlag !== "false" &&
    (import.meta.env.DEV || import.meta.env.MODE === "test");
  const isOwner = isMockMode || user?.role === "owner";

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setReauthRequired(true);
      timerRef.current = null;
    }, REAUTH_TIMEOUT_MS);
  }, [clearTimer]);

  const handleActivity = useCallback(() => {
    if (!reauthRequired) {
      scheduleTimer();
    }
  }, [reauthRequired, scheduleTimer]);

  useEffect(() => {
    if (!isOwner || !selectedChild || isMockMode) {
      clearTimer();
      setReauthRequired(false);
      return;
    }

    scheduleTimer();
    const docEvents: Array<keyof DocumentEventMap> = [
      "pointerdown",
      "keydown",
      "visibilitychange",
    ];
    const winEvents: Array<keyof WindowEventMap> = ["scroll"];
    const listener = () => handleActivity();
    docEvents.forEach((event) =>
      document.addEventListener(event, listener, { passive: true }),
    );
    winEvents.forEach((event) =>
      window.addEventListener(event, listener, { passive: true }),
    );

    return () => {
      docEvents.forEach((event) =>
        document.removeEventListener(event, listener),
      );
      winEvents.forEach((event) => window.removeEventListener(event, listener));
      clearTimer();
    };
  }, [
    isOwner,
    selectedChild,
    isMockMode,
    handleActivity,
    scheduleTimer,
    clearTimer,
  ]);

  const handleReauthContinue = () => {
    setReauthRequired(false);
    scheduleTimer();
  };

  const handleLogout = async () => {
    clearTimer();
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error(error);
    } finally {
      clearAuth();
    }
  };

  const renderTabContent = () => {
    if (!selectedChild) {
      return null;
    }
    switch (activeTab) {
      case "pediatra":
        return <HealthPediatrianTab childId={selectedChild.id} />;
      case "vacinas":
        return <HealthVaccinesTab childId={selectedChild.id} />;
      case "crescimento":
      default:
        return <HealthGrowthTab childId={selectedChild.id} />;
    }
  };

  if (isAuthLoading && !isMockMode) {
    return (
      <B2CLoadingState
        variant="page"
        label="Buscando o perfil e as permissões da conta..."
      />
    );
  }

  if (!isOwner) {
    return (
      <B2CEmptyState
        variant="page"
        tone="danger"
        icon={FolderLock}
        title="Aba privada"
        description="Esta área é um cofre privado, acessível apenas pelo dono do álbum. Peça ao Owner para revisar os dados de saúde ou convide-o a compartilhar as atualizações com você."
      />
    );
  }

  if (!selectedChild) {
    return (
      <B2CEmptyState
        variant="page"
        icon={Baby}
        title="Escolha uma criança"
        description="Para acompanhar curva, consultas e documentos, selecione ou cadastre uma criança primeiro."
        primaryAction={{
          label: "Ir para Perfil da Criança",
          to: "/jornada/perfil-crianca",
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1
        className="mb-6 text-center text-3xl font-serif font-bold"
        style={{ color: "var(--bb-color-ink)" }}
      >
        Livro da Saúde
      </h1>

      <div
        className="mb-6 rounded-2xl border p-1.5 shadow-sm"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <LayoutGroup id="health-tabs">
          <div className="flex flex-wrap gap-1.5">
            {HEALTH_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex-1 min-w-[140px] overflow-hidden rounded-2xl px-4 py-1.5 text-sm font-semibold transition-all duration-300 active:scale-[0.98]"
                  style={{
                    color: isActive
                      ? "var(--bb-color-surface)"
                      : "var(--bb-color-ink-muted)",
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="health-nav-pill"
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        backgroundColor: "var(--bb-color-accent)",
                        boxShadow: "0 8px 20px rgba(242,153,93,0.2)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center justify-center gap-2">
                    <Icon
                      className="h-4 w-4 transition-colors duration-300"
                      style={{
                        color: isActive
                          ? "var(--bb-color-surface)"
                          : "var(--bb-color-ink-muted)",
                      }}
                    />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <div className="mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {!isMockMode && reauthRequired && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(42, 42, 42, 0.6)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-8 text-center shadow-2xl"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              borderColor: "var(--bb-color-border)",
            }}
          >
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: "var(--bb-color-danger-soft)",
                color: "var(--bb-color-danger)",
              }}
            >
              <Shield className="h-5 w-5" />
            </div>
            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              Sessão protegida
            </p>
            <h2
              className="mt-2 font-serif text-2xl"
              style={{ color: "var(--bb-color-ink)" }}
            >
              Vamos confirmar que é você
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              Por segurança, a aba Saúde bloqueia após alguns minutos de
              inatividade. Continue para destravar ou encerre a sessão se não
              estiver em um dispositivo seguro.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition"
                style={{
                  borderColor: "var(--bb-color-border)",
                  color: "var(--bb-color-ink)",
                }}
              >
                Encerrar sessão
              </button>
              <button
                type="button"
                onClick={handleReauthContinue}
                className="inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                style={{
                  backgroundColor: "var(--bb-color-accent)",
                  color: "var(--bb-color-surface)",
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
