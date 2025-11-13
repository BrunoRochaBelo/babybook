import { useNavigate, useParams } from "react-router-dom";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useMomentTemplate } from "../hooks/useMomentTemplate";
import { MomentForm } from "../components/MomentForm";
import { ChevronLeft } from "lucide-react";

export const MomentDraftPage = () => {
  const navigate = useNavigate();
  const { template_id } = useParams<{ template_id: string }>();
  const { selectedChild } = useSelectedChild();
  const { data: template, isLoading } = useMomentTemplate(template_id || "");

  if (!selectedChild) {
    return (
      <div className="max-w-2xl mx-auto py-6 text-center">
        <p className="text-gray-500">Selecione uma criança primeiro.</p>
        <button onClick={() => navigate("/perfil")} className="mt-4 bg-primary text-white px-4 py-2 rounded-lg">
          Ir para Perfil
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-6 animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg w-2/3 mb-6" />
        <div className="h-96 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/momentos")}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {template?.title || "Novo Momento"}
          </h1>
          {template?.description && (
            <p className="text-sm text-gray-500">{template.description}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <MomentForm childId={selectedChild.id} template={template} />
      </div>
    </div>
  );
};
