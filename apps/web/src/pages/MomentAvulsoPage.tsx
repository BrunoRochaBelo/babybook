import { useNavigate } from "react-router-dom";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { MomentForm } from "@/components/MomentForm";
import { ChevronLeft } from "lucide-react";

export const MomentAvulsoPage = () => {
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();

  if (!selectedChild) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-[#C9D3C2]">Selecione uma criança primeiro</p>
      </div>
    );
  }

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
            Novo Momento
          </h1>
          <p className="text-sm text-[#C9D3C2]">
            Crie um momento livre, sem necessidade de seguir um template
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-6 border border-[#C9D3C2]">
        <MomentForm childId={selectedChild.id} />
      </div>
    </div>
  );
};
