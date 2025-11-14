import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Stethoscope,
  Syringe,
  FolderLock,
  Shield,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useAuthStore } from "@/store/auth";
import { HealthGrowthTab } from "@/components/HealthGrowthTab";
import { HealthPediatrianTab } from "@/components/HealthPediatrianTab";
import { HealthVaccinesTab } from "@/components/HealthVaccinesTab";

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
  const logout = useAuthStore((state) => state.logout);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
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
      winEvents.forEach((event) =>
        window.removeEventListener(event, listener),
      );
      clearTimer();
    };
  }, [isOwner, selectedChild, isMockMode, handleActivity, scheduleTimer, clearTimer]);

  const handleReauthContinue = () => {
    setReauthRequired(false);
    scheduleTimer();
  };

  const handleLogout = () => {
    clearTimer();
    logout();
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
      <section className="mx-auto w-full max-w-4xl px-6 py-12 text-center">
        <div className="rounded-[32px] border border-border bg-surface p-8 shadow-sm">
          <h1 className="font-serif text-3xl text-ink">Carregando perfil</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Buscando o perfil e as permissões da conta para liberar a aba Saúde...
          </p>
        </div>
      </section>
    );
  }

  if (!isOwner) {
    return (
      <section className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="rounded-[32px] border border-border bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            <FolderLock className="h-5 w-5" />
          </div>
          <h1 className="font-serif text-3xl text-ink">Aba privada</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Ops! Esta área é um cofre privado, acessível apenas pelo dono do
            álbum. Peça ao Owner para revisar os dados de saúde ou convide-o a
            compartilhar as atualizações com você.
          </p>
        </div>
      </section>
    );
  }

  if (!selectedChild) {
    return (
      <section className="mx-auto w-full max-w-4xl px-6 py-12 text-center">
        <div className="rounded-[32px] border border-border bg-surface p-8 shadow-sm">
          <h1 className="font-serif text-3xl text-ink">Escolha uma criança</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Para acompanhar curva, consultas e documentos, selecione ou cadastre
            uma criança primeiro.
          </p>
          <Link
            to="/jornada/perfil-crianca"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Ir para Perfil da Criança
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
          Livro 2 • Saúde
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink">
          {selectedChild.name}: utilitários privados
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Guardamos dados sensíveis de crescimento, consultas e documentos. Só
          você, como dono do álbum, tem acesso.
        </p>
      </header>

      <div className="mt-6 rounded-[28px] border border-border bg-surface p-2 shadow-sm">
        <LayoutGroup id="health-tabs">
          <div className="flex flex-wrap gap-2">
            {HEALTH_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex-1 min-w-[150px] overflow-hidden rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300",
                    isActive
                      ? "text-primary-foreground"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="health-nav-pill"
                      className="absolute inset-0 rounded-full bg-primary shadow-[0_12px_24px_rgba(242,153,93,0.28)]"
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center justify-center gap-2">
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors duration-300",
                        isActive ? "text-primary-foreground" : "text-ink-muted",
                      )}
                    />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <div className="mt-8">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
          <div className="w-full max-w-md rounded-[32px] border border-border bg-surface p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 text-danger">
              <Shield className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
              Sessão protegida
            </p>
            <h2 className="mt-2 font-serif text-2xl text-ink">
              Vamos confirmar que é você
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              Por segurança, a aba Saúde bloqueia após alguns minutos de inatividade. Continue para
              destravar ou encerre a sessão se não estiver em um dispositivo seguro.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink"
              >
                Encerrar sessão
              </button>
              <button
                type="button"
                onClick={handleReauthContinue}
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
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
