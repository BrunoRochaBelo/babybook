import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Play, Camera } from "lucide-react";
import { useMoments } from "@/hooks/api";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useAppStore } from "@/store/app";
import { MomentCard } from "@/components/MomentCard";
import {
  B2CLoadingState,
  B2CErrorState,
  B2CEmptyState,
} from "@/layouts/b2cStates";
import { DashboardSkeleton } from "@/components/skeletons";

const templates = [
  {
    id: "descoberta",
    title: "A Descoberta",
    description: "O primeiro momento especial",
  },
  {
    id: "primeiro-sorriso",
    title: "Primeiro Sorriso",
    description: "Aquele sorriso inesquecível",
  },
  {
    id: "primeira-gargalhada",
    title: "Primeira Gargalhada",
    description: "O som mais especial",
  },
];

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { children = [], selectedChild } = useSelectedChild();
  const setSelectedChildId = useAppStore((state) => state.setSelectedChildId);
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
        title="Não foi possível carregar seus momentos"
        description="Verifique sua conexão e tente novamente."
        errorDetails={error instanceof Error ? error.message : null}
        onRetry={() => refetch()}
        skeleton={<DashboardSkeleton />}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1
        className="mb-6 text-center text-3xl font-serif font-bold"
        style={{ color: "var(--bb-color-ink)" }}
      >
        Jornada
      </h1>

      {/* Child Selector */}
      {children.length > 0 && (
        <div className="mb-6 flex justify-center">
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
          className="rounded-2xl shadow-lg p-6 mb-6 border"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <h2
            className="text-2xl font-serif font-bold mb-2"
            style={{ color: "var(--bb-color-ink)" }}
          >
            Sua Jornada
          </h2>
          <p
            className="text-sm mb-4"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            Próxima sugestão
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
              Começar
            </button>
          </div>
          <p
            className="text-xs"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            Não obrigatório. Você pode criar um momento livre a qualquer
            momento.
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="mb-8">
        <h3
          className="text-lg font-bold mb-4"
          style={{ color: "var(--bb-color-ink)" }}
        >
          Seus Momentos
        </h3>

        {moments.length > 0 ? (
          <div className="space-y-4">
            {moments.map((moment) => (
              <MomentCard key={moment.id} moment={moment} />
            ))}
          </div>
        ) : (
          <B2CEmptyState
            variant="section"
            icon={Camera}
            title="Nenhum momento registrado ainda"
            description="Comece a documentar a jornada do seu bebê. Cada momento é único e especial."
            primaryAction={{
              label: "Registrar Primeiro Momento",
              onClick: handleCreateAvulso,
              icon: Plus,
            }}
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
