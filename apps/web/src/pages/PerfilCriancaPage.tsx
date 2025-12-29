import { useNavigate } from "react-router-dom";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { Edit, Home, Lock, Send } from "lucide-react";

export const PerfilCriancaPage = () => {
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();

  if (!selectedChild) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        <p style={{ color: "var(--bb-color-ink-muted)" }}>
          Selecione uma criança primeiro
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header com foto */}
      <div
        className="rounded-2xl p-6 border mb-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <div className="flex gap-4 items-start">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ backgroundColor: "var(--bb-color-bg)" }}
          >
            👶
          </div>
          <div className="flex-1">
            <h1
              className="text-2xl font-serif font-bold"
              style={{ color: "var(--bb-color-ink)" }}
            >
              {selectedChild.name}
            </h1>
            {selectedChild.birthday && (
              <p
                className="text-sm"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                Nascido em{" "}
                {new Date(selectedChild.birthday).toLocaleDateString("pt-BR")}
              </p>
            )}
            <button
              className="mt-2 flex items-center gap-2 hover:underline font-semibold text-sm"
              style={{ color: "var(--bb-color-accent)" }}
            >
              <Edit className="w-4 h-4" />
              Editar Perfil
            </button>
          </div>
        </div>
      </div>

      {/* Seções principais */}
      <div className="space-y-4">
        <button
          className="w-full rounded-2xl p-6 border text-left transition-colors"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Home className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
            <h3
              className="font-semibold"
              style={{ color: "var(--bb-color-ink)" }}
            >
              Árvore da Família
            </h3>
          </div>
          <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
            Conecte pais, avós e outras pessoas especiais
          </p>
        </button>

        <button
          onClick={() => navigate(`/capsule/${selectedChild.id}`)}
          className="w-full rounded-2xl p-6 border text-left transition-colors"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
            <h3
              className="font-semibold"
              style={{ color: "var(--bb-color-ink)" }}
            >
              Cápsula do Tempo
            </h3>
          </div>
          <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
            Escreva uma carta para o futuro
          </p>
        </button>

        <button
          className="w-full rounded-2xl p-6 border text-left transition-colors"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Send className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
            <h3
              className="font-semibold"
              style={{ color: "var(--bb-color-ink)" }}
            >
              Compartilhar Álbum
            </h3>
          </div>
          <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
            Convide familiares para acompanhar
          </p>
        </button>
      </div>

      {/* Link para configurações da conta */}
      <div
        className="mt-8 p-4 rounded-2xl"
        style={{ backgroundColor: "var(--bb-color-bg)" }}
      >
        <p className="text-sm mb-2" style={{ color: "var(--bb-color-ink)" }}>
          Precisa gerenciar sua conta?
        </p>
        <button
          onClick={() => navigate("/perfil-usuario")}
          className="hover:underline font-semibold text-sm"
          style={{ color: "var(--bb-color-accent)" }}
        >
          Ir para Configurações da Conta
        </button>
      </div>
    </div>
  );
};
