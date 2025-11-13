import { useNavigate, useParams } from "react-router-dom";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { MomentForm } from "@/components/MomentForm";
import { ChevronLeft } from "lucide-react";

const templates: Record<string, { title: string; description: string }> = {
  descoberta: {
    title: "A Descoberta",
    description:
      "O primeiro momento especial. Registre detalhes do nascimento ou chegada.",
  },
  "primeiro-sorriso": {
    title: "Primeiro Sorriso",
    description: "Aquele sorriso inesquecível que derreteu seu coração.",
  },
  "primeira-gargalhada": {
    title: "Primeira Gargalhada",
    description: "O som mais especial que você já ouviu.",
  },
  "primeira-comida": {
    title: "Primeira Comida",
    description: "A reação à introdução alimentar.",
  },
  "primeiro-dente": {
    title: "Primeiro Dente",
    description: "O tão esperado primeiro dentinho!",
  },
  "primeiro-dia-escola": {
    title: "Primeiro Dia na Escola",
    description: "Um marco importante nessa jornada.",
  },
  "meses-passados": {
    title: "Meses se Passaram",
    description: "Reflexão sobre o tempo que passou.",
  },
};

export const MomentDraftPage = () => {
  const navigate = useNavigate();
  const { template_id } = useParams<{ template_id: string }>();
  const { selectedChild } = useSelectedChild();

  if (!selectedChild) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-[#C9D3C2]">Selecione uma criança primeiro</p>
      </div>
    );
  }

  const template = template_id ? templates[template_id] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/jornada")}
          className="p-2 hover:bg-[#F7F3EF] rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#2A2A2A]" />
        </button>
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2A2A2A]">
            {template?.title || "Novo Momento"}
          </h1>
          {template?.description && (
            <p className="text-sm text-[#C9D3C2]">{template.description}</p>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-6 border border-[#C9D3C2]">
        <MomentForm childId={selectedChild.id} templateId={template_id} />
      </div>
    </div>
  );
};
