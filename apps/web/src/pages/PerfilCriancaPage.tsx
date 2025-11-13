import { useNavigate } from "react-router-dom";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { Edit, Home, Lock, Send } from "lucide-react";

export const PerfilCriancaPage = () => {
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();

  if (!selectedChild) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        <p className="text-[#C9D3C2]">Selecione uma criança primeiro</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header com foto */}
      <div className="bg-white rounded-2xl p-6 border border-[#C9D3C2] mb-6">
        <div className="flex gap-4 items-start">
          <div className="w-20 h-20 rounded-2xl bg-[#F7F3EF] flex items-center justify-center text-4xl">
            👶
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-serif font-bold text-[#2A2A2A]">
              {selectedChild.name}
            </h1>
            {selectedChild.birthday && (
              <p className="text-sm text-[#C9D3C2]">
                Nascido em{" "}
                {new Date(selectedChild.birthday).toLocaleDateString("pt-BR")}
              </p>
            )}
            <button className="mt-2 flex items-center gap-2 text-[#F2995D] hover:underline font-semibold text-sm">
              <Edit className="w-4 h-4" />
              Editar Perfil
            </button>
          </div>
        </div>
      </div>

      {/* Seções principais */}
      <div className="space-y-4">
        <button className="w-full bg-white rounded-2xl p-6 border border-[#C9D3C2] text-left hover:border-[#F2995D] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <Home className="w-5 h-5 text-[#F2995D]" />
            <h3 className="font-semibold text-[#2A2A2A]">Árvore da Família</h3>
          </div>
          <p className="text-sm text-[#C9D3C2]">
            Conecte pais, avós e outras pessoas especiais
          </p>
        </button>

        <button
          onClick={() => navigate(`/capsule/${selectedChild.id}`)}
          className="w-full bg-white rounded-2xl p-6 border border-[#C9D3C2] text-left hover:border-[#F2995D] transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-5 h-5 text-[#F2995D]" />
            <h3 className="font-semibold text-[#2A2A2A]">Cápsula do Tempo</h3>
          </div>
          <p className="text-sm text-[#C9D3C2]">
            Escreva uma carta para o futuro
          </p>
        </button>

        <button className="w-full bg-white rounded-2xl p-6 border border-[#C9D3C2] text-left hover:border-[#F2995D] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <Send className="w-5 h-5 text-[#F2995D]" />
            <h3 className="font-semibold text-[#2A2A2A]">Compartilhar Álbum</h3>
          </div>
          <p className="text-sm text-[#C9D3C2]">
            Convide familiares para acompanhar
          </p>
        </button>
      </div>

      {/* Link para configurações da conta */}
      <div className="mt-8 p-4 bg-[#F7F3EF] rounded-2xl">
        <p className="text-sm text-[#2A2A2A] mb-2">
          Precisa gerenciar sua conta?
        </p>
        <button
          onClick={() => navigate("/perfil-usuario")}
          className="text-[#F2995D] hover:underline font-semibold text-sm"
        >
          Ir para Configurações da Conta
        </button>
      </div>
    </div>
  );
};
