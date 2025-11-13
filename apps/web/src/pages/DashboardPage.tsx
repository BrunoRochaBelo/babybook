import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Play } from "lucide-react";
import { useMoments } from "@/hooks/api";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useAppStore } from "@/store/app";
import { MomentCard } from "@/components/MomentCard";

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
  const [nextTemplate, setNextTemplate] = useState(templates[0]);
  const { data: moments = [], isLoading } = useMoments(selectedChild?.id);

  const handleStartTemplate = () => {
    navigate(`/jornada/moment/draft/${nextTemplate.id}`);
  };

  const handleCreateAvulso = () => {
    navigate("/jornada/moment/avulso");
  };

  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Child Selector */}
      {children.length > 0 && (
        <div className="mb-6">
          <select
            value={selectedChild?.id || ""}
            onChange={(e) => handleChildChange(e.target.value)}
            className="w-full px-4 py-2 border-2 border-[#C9D3C2] rounded-2xl bg-white text-[#2A2A2A]"
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
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-[#C9D3C2]">
          <h2 className="text-2xl font-serif font-bold text-[#2A2A2A] mb-2">
            Sua Jornada
          </h2>
          <p className="text-[#C9D3C2] text-sm mb-4">Próxima sugestão</p>
          <div className="bg-gradient-to-r from-[#F2995D] to-[#F2995D]/80 rounded-2xl p-6 text-white mb-4">
            <h3 className="text-lg font-bold mb-2">{nextTemplate.title}</h3>
            <p className="text-sm opacity-90 mb-4">
              {nextTemplate.description}
            </p>
            <button
              onClick={handleStartTemplate}
              className="flex items-center gap-2 bg-white text-[#F2995D] px-6 py-2 rounded-2xl font-semibold hover:bg-opacity-90 transition-all active:scale-95"
            >
              <Play className="w-4 h-4" />
              Começar
            </button>
          </div>
          <p className="text-xs text-[#C9D3C2]">
            Não obrigatório. Você pode criar um momento livre a qualquer
            momento.
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-[#2A2A2A] mb-4">Seus Momentos</h3>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl h-32 shadow-md animate-pulse"
              />
            ))}
          </div>
        ) : moments.length > 0 ? (
          <div className="space-y-4">
            {moments.map((moment: any) => (
              <MomentCard key={moment.id} moment={moment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#C9D3C2] mb-4">
              Nenhum momento registrado ainda
            </p>
            <button
              onClick={handleCreateAvulso}
              className="inline-flex items-center gap-2 bg-[#F2995D] text-white px-6 py-3 rounded-2xl font-semibold hover:bg-[#F2995D]/90 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Registrar Primeiro Momento
            </button>
          </div>
        )}
      </div>

      {/* FAB (Floating Action Button) */}
      {selectedChild && moments.length > 0 && (
        <button
          onClick={handleCreateAvulso}
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#F2995D] text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
