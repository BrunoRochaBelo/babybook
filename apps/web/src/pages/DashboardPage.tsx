import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Play, Camera } from "lucide-react";
import { useTranslation } from "@babybook/i18n";
import { useMoments } from "@/hooks/api";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useAppStore } from "@/store/app";
import { MomentCard } from "@/components/MomentCard";
import { B2CErrorState } from "@/layouts/b2cStates";
import { B2CEmptyState } from "@/components/B2CEmptyState";
import { DashboardSkeleton } from "@/components/skeletons";

export const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { children = [], selectedChild } = useSelectedChild();
  const setSelectedChildId = useAppStore((state) => state.setSelectedChildId);

  const templates = useMemo(() => [
    {
      id: "descoberta",
      title: t("b2c.dashboard.templates.descoberta.title"),
      description: t("b2c.dashboard.templates.descoberta.description"),
    },
    {
      id: "primeiro-sorriso",
      title: t("b2c.dashboard.templates.primeiro-sorriso.title"),
      description: t("b2c.dashboard.templates.primeiro-sorriso.description"),
    },
    {
      id: "primeira-gargalhada",
      title: t("b2c.dashboard.templates.primeira-gargalhada.title"),
      description: t("b2c.dashboard.templates.primeira-gargalhada.description"),
    },
  ], [t]);

  const [nextTemplate] = useState(templates[0]);
  const {
    data: moments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useMoments(selectedChild?.id);

  const handleStartTemplate = () => {
    navigate(`/jornada/moment/draft/${nextTemplate.id}`);
  };

  const handleCreateAvulso = () => {
    navigate("/jornada/moment/avulso");
  };

  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
  };

  // Estado de loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Estado de erro
  if (isError) {
    return (
      <B2CErrorState
        title={t("b2c.dashboard.errorTitle")}
        description={t("b2c.dashboard.errorDescription")}
        errorDetails={error instanceof Error ? error.message : null}
        onRetry={() => refetch()}
        skeleton={<DashboardSkeleton />}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="mb-8 text-3xl font-bold">
        {t("b2c.dashboard.title")}
      </h1>

      {/* Child Selector */}
      {children.length > 0 && (
        <div className="mb-8 flex justify-center">
          <select
            value={selectedChild?.id || ""}
            onChange={(e) => handleChildChange(e.target.value)}
            className="w-full max-w-sm px-4 py-2 border-2 rounded-2xl transition-colors focus:outline-none"
            style={{
              borderColor: "var(--bb-color-border)",
              backgroundColor: "var(--bb-color-surface)",
              color: "var(--bb-color-ink)",
            }}
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* HUD (Head-Up Display) */}
      {selectedChild && (
        <div
          className="rounded-2xl shadow-lg p-6 mb-8 border"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <h2 className="text-2xl font-bold mb-2">
            {t("b2c.dashboard.hud.title")}
          </h2>
          <p
            className="text-sm mb-4"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            {t("b2c.dashboard.hud.suggestion")}
          </p>
          <div
            className="rounded-2xl p-6 text-white mb-4"
            style={{
              background:
                "linear-gradient(to right, var(--bb-color-accent), color-mix(in srgb, var(--bb-color-accent) 80%, transparent))",
            }}
          >
            <h3 className="text-lg font-bold mb-2">{nextTemplate.title}</h3>
            <p className="text-sm opacity-90 mb-4">
              {nextTemplate.description}
            </p>
            <button
              onClick={handleStartTemplate}
              className="flex items-center gap-2 px-6 py-2 rounded-2xl font-semibold hover:opacity-90 transition-all active:scale-95"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                color: "var(--bb-color-accent)",
              }}
            >
              <Play className="w-4 h-4" />
              {t("b2c.dashboard.hud.start")}
            </button>
          </div>
          <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>
            {t("b2c.dashboard.hud.hint")}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="mb-8">
        <h3
          className="text-lg font-bold mb-4"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {t("b2c.dashboard.hud.momentsTitle")}
        </h3>

        {moments.length > 0 ? (
          <div className="space-y-4">
            {moments.map((moment) => (
              <MomentCard key={moment.id} moment={moment} />
            ))}
          </div>
        ) : (
          <B2CEmptyState
            title={t("b2c.moments.empty.title")}
            description={t("b2c.moments.empty.description")}
            illustration={
              <div className="text-6xl animate-bounce">
                🌱
              </div>
            }
            action={
              <button
                onClick={handleCreateAvulso}
                className="mt-4 flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-md active:scale-95 transition-all hover:brightness-110"
                style={{
                  backgroundColor: "var(--bb-color-accent)",
                  color: "var(--bb-color-surface)",
                }}
              >
                <Plus className="w-5 h-5" />
                {t("b2c.moments.empty.action")}
              </button>
            }
          />
        )}
      </div>

      {/* FAB (Floating Action Button) */}
      {selectedChild && moments.length > 0 && (
        <button
          onClick={handleCreateAvulso}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all active:scale-95"
          style={{
            backgroundColor: "var(--bb-color-accent)",
            color: "var(--bb-color-surface)",
          }}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
