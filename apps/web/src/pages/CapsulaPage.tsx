import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, Unlock } from "lucide-react";
import { useSelectedChild } from "@/hooks/useSelectedChild";

export const CapsulaPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedChild } = useSelectedChild();
  const [isSealed, setIsSealed] = useState(false);
  const [letter, setLetter] = useState("");
  const [openDate, setOpenDate] = useState("");

  if (!selectedChild || selectedChild.id !== id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        <p className="text-[#C9D3C2]">Cápsula não encontrada</p>
      </div>
    );
  }

  const handleSeal = () => {
    if (openDate) {
      // Validar que a data é pelo menos 10 anos no futuro
      const futurDate = new Date(openDate);
      const today = new Date();
      const diffYears = futurDate.getFullYear() - today.getFullYear();

      if (diffYears < 10) {
        alert("A cápsula deve estar selada por pelo menos 10 anos");
        return;
      }

      // Mostrar confirmação solene
      const confirmed = window.confirm(
        `Selar esta cápsula para ${futurDate.toLocaleDateString("pt-BR")}? Você não poderá ver ou editar o conteúdo até lá.`,
      );

      if (confirmed) {
        setIsSealed(true);
      }
    }
  };

  const handleOpen = () => {
    const confirmed = window.confirm(
      "Abrir a cápsula? Você poderá ler a carta.",
    );
    if (confirmed) {
      setIsSealed(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="mb-8 text-3xl font-bold">
        Cápsula do Tempo
      </h1>

      {!isSealed ? (
        // Modo edição - não selada
        <div 
          className="rounded-2xl p-6 border transition-all mb-8"
          style={{ 
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)"
          }}
        >
          <h2 className="text-lg font-semibold mb-4">
            Escreva a Sua Carta
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Data de Abertura
              </label>
              <input
                type="date"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                className="w-full px-4 py-2 border-2 rounded-2xl bg-transparent"
                style={{ borderColor: "var(--bb-color-border)" }}
              />
              <p className="mt-1 text-xs opacity-60">
                Mínimo de 10 anos a partir de hoje
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                Sua Mensagem
              </label>
              <textarea
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#C9D3C2] rounded-2xl resize-none"
                rows={8}
                placeholder="Escreva uma mensagem especial para o futuro..."
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSeal}
              disabled={!letter || !openDate}
              className="flex-1 flex items-center justify-center gap-2 text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ backgroundColor: "var(--bb-color-accent)" }}
            >
              <Lock className="w-5 h-5" />
              Selar Cápsula
            </button>
            <button
              onClick={() => navigate(`/jornada/perfil-crianca`)}
              className="flex-1 px-6 py-3 rounded-2xl font-semibold hover:opacity-80 transition-all text-sm"
              style={{
                backgroundColor: "var(--bb-color-muted)",
                color: "var(--bb-color-ink)",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        // Modo visualização - selada
        <div className="bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] rounded-2xl p-8 text-center text-white">
          <Lock className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-serif font-bold mb-2">Cápsula Selada</h2>
          <p className="text-white/80 mb-6">
            Selada até{" "}
            <strong>{new Date(openDate).toLocaleDateString("pt-BR")}</strong>
          </p>

          <div className="bg-white/10 rounded-2xl p-6 mb-6 backdrop-blur">
            <p className="text-sm opacity-70">Dias até a abertura:</p>
            <p className="text-3xl font-bold">
              {Math.ceil(
                (new Date(openDate).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24),
              )}
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleOpen}
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-semibold transition-all"
            >
              <Unlock className="w-4 h-4" />
              Cancelar Selo (Editar)
            </button>
            <button
              onClick={() => navigate(`/jornada/perfil-crianca`)}
              className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl font-semibold transition-all"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
