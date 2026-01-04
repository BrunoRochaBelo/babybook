import { useNavigate } from "react-router-dom";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { Edit, Home, Lock, Send, ChevronLeft, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { motion } from "motion/react";

export const PerfilCriancaPage = () => {
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();

  if (!selectedChild) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        <Link
          to="/jornada/minha-conta"
          className="inline-flex items-center gap-2 mb-6 p-2 -ml-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--bb-color-bg)]"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </Link>
        <p style={{ color: "var(--bb-color-ink-muted)" }}>
          Selecione uma criança primeiro
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto px-4 py-6"
    >
      {/* Botão Voltar */}
      <Link
        to="/jornada/minha-conta"
        className="inline-flex items-center gap-2 mb-6 p-2 -ml-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--bb-color-bg)]"
        style={{ color: "var(--bb-color-ink-muted)" }}
      >
        <ChevronLeft className="w-5 h-5" />
        Voltar
      </Link>

      {/* Header com foto (Clean Style) */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 items-start">
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl shadow-sm"
          style={{ backgroundColor: "var(--bb-color-surface)", border: "1px solid var(--bb-color-border)" }}
        >
          👶
        </div>
        <div className="flex flex-col justify-center min-h-[6rem]">
          <h1
            className="text-3xl font-serif font-bold leading-tight"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {selectedChild.name}
          </h1>
          {selectedChild.birthday && (
            <p
              className="text-lg"
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

      {/* Seções principais */}
      <div className="space-y-4">
        <button
          className="w-full rounded-2xl p-6 border text-left transition-colors hover:opacity-95 active:scale-[0.99]"
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
          className="w-full rounded-2xl p-6 border text-left transition-colors hover:opacity-95 active:scale-[0.99]"
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
          className="w-full rounded-2xl p-6 border text-left transition-colors hover:opacity-95 active:scale-[0.99]"
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

        {/* Sugestão Teia: Família */}
        <Link
          to="/jornada/familia"
          className="flex items-center justify-between p-4 rounded-2xl mt-8 transition-all hover:opacity-90 active:scale-[0.99]"
          style={{
            backgroundColor: "var(--bb-color-bg)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bb-color-surface)", border: "1px solid var(--bb-color-border)" }}>
                <Users className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
             </div>
             <div>
                <p className="font-semibold text-sm" style={{ color: "var(--bb-color-ink)" }}>Gerenciar Família</p>
                <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>Adicione membros e permissões</p>
             </div>
          </div>
          <ArrowRight className="w-5 h-5" style={{ color: "var(--bb-color-ink-muted)" }} />
        </Link>
      </div>
    </motion.div>
  );
};
