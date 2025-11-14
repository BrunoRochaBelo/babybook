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
      <div className="mx-auto max-w-2xl py-6 text-center">
        <p className="text-gray-500">Selecione uma crianca primeiro.</p>
        <button
          onClick={() => navigate("/perfil-usuario")}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-white"
        >
          Ir para Perfil
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl animate-pulse py-6">
        <div className="mb-6 h-12 w-2/3 rounded-lg bg-gray-200" />
        <div className="h-96 rounded-lg bg-gray-200" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <h1 className="text-2xl font-serif text-ink">Estamos quase lá!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ainda não temos o formulário configurado para este momento
          ({template_id}). Compartilhe este identificador com o time de produto para
          que possamos liberar os campos específicos e, enquanto isso, continue
          registrando com o formulário genérico de momentos avulsos.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate("/jornada")}
            className="rounded-2xl border border-sage/80 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink"
          >
            Voltar para a jornada
          </button>
          <button
            onClick={() => navigate("/jornada/moment/avulso")}
            className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Usar momento avulso
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/momentos")}
          className="rounded-full p-2 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {template?.title || "Novo Momento"}
          </h1>
          {template?.prompt && (
            <p className="text-sm text-gray-500">{template.prompt}</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <MomentForm childId={selectedChild.id} template={template} />
      </div>
    </div>
  );
};
