import React from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string;
}

interface NextMomentSuggestionProps {
  template: Template;
}

export const NextMomentSuggestion = ({ template }: NextMomentSuggestionProps) => {
  const navigate = useNavigate();

  const handleStartTemplate = () => {
    navigate(`/jornada/moment/draft/${template.id}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
      <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">
        Sua Jornada
      </h2>
      <p className="text-gray-400 text-sm mb-4">Próxima sugestão</p>
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white mb-4">
        <h3 className="text-lg font-bold mb-2">{template.title}</h3>
        <p className="text-sm opacity-90 mb-4">{template.description}</p>
        <button
          onClick={handleStartTemplate}
          className="flex items-center gap-2 bg-white text-primary px-6 py-2 rounded-2xl font-semibold hover:bg-opacity-90 transition-all active:scale-95"
        >
          <Play className="w-4 h-4" />
          Começar
        </button>
      </div>
      <p className="text-xs text-gray-400">
        Não obrigatório. Você pode criar um momento livre a qualquer momento.
      </p>
    </div>
  );
};
