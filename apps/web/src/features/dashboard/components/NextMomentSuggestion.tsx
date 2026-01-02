import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import type { CatalogSequenceItem } from "@/data/momentCatalog";
import { motion } from "motion/react";

interface NextMomentSuggestionProps {
  template: CatalogSequenceItem | null;
  childName?: string;
  hasBirthday: boolean;
}

export const NextMomentSuggestion = ({
  template,
  childName,
  hasBirthday,
}: NextMomentSuggestionProps) => {
  const navigate = useNavigate();

  // Handle "No Child" state
  if (!childName) {
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/jornada/perfil-crianca")}
        className="relative w-full overflow-hidden rounded-2xl p-5 text-left shadow-lg transition-shadow hover:shadow-xl bg-gradient-to-br from-pink-400 to-rose-500 dark:from-pink-600 dark:to-rose-800"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="z-10">
            <p className="text-xs font-bold uppercase tracking-wider text-pink-100 dark:text-pink-200">
              Comece agora
            </p>
            <h3 className="font-serif text-lg font-bold text-white mt-0.5">
              Cadastrar perfil da criança
            </h3>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm z-10 transition-colors group-hover:bg-white/30">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
        {/* Decorative Circles */}
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      </motion.button>
    );
  }

  // Handle "No Birthday" state
  if (!hasBirthday) {
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/jornada/perfil-crianca")}
        className="relative w-full overflow-hidden rounded-2xl p-5 text-left shadow-lg transition-shadow hover:shadow-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 dark:from-purple-700 dark:to-fuchsia-900"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="z-10">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-100 dark:text-purple-200">
              Configure o HUD
            </p>
            <h3 className="font-serif text-lg font-bold text-white mt-0.5">
              Definir data de nascimento
            </h3>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm z-10 transition-colors group-hover:bg-white/30">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      </motion.button>
    );
  }

  // Handle "Completed" state
  if (!template) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border p-5 text-center shadow-sm"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <div className="mb-2 flex justify-center text-[var(--bb-color-accent)]">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="font-serif text-lg text-[var(--bb-color-ink)]">
          Jornada Completa!
        </p>
        <p className="text-sm text-[var(--bb-color-ink-muted)]">
          Você registrou todos os momentos principais.
        </p>
        <button
          onClick={() => navigate("/jornada/moment/avulso")}
          className="mt-3 text-sm font-semibold text-[var(--bb-color-accent)] hover:underline"
        >
          Criar momento livre
        </button>
      </motion.div>
    );
  }

  // Main HUD State - Nudge
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="relative overflow-hidden rounded-2xl shadow-sm border border-orange-100/50 dark:border-stone-800 bg-gradient-to-br from-amber-50/50 via-[#fffbf6] to-orange-50/50 dark:from-[#1c1917] dark:via-[#201d1b] dark:to-[#1c1917]"
    >
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
             <div className="p-1 rounded-full bg-orange-50 dark:bg-orange-900/10">
                <Sparkles className="h-3 w-3 text-orange-400 dark:text-orange-300" />
             </div>
             <p className="text-xs font-bold uppercase tracking-wider text-orange-600/70 dark:text-orange-300/80">
                Sugestão do dia
             </p>
          </div>
          <h3 className="font-serif text-2xl font-bold text-[var(--bb-color-ink)] dark:text-orange-50 leading-tight truncate">
            {template.title}
          </h3>
          <p className="text-[var(--bb-color-ink-muted)] dark:text-stone-400 text-sm mt-1 line-clamp-1">
             {template.prompt}
          </p>
        </div>
        
        <button
          onClick={() => navigate(`/jornada/moment/draft/${template.id}`)}
          className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-[var(--bb-color-accent)] px-5 py-3 text-sm font-bold text-[var(--bb-color-surface)] shadow-sm transition-all hover:opacity-90 active:scale-95"
        >
          Registrar
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      
      {/* Decorative background elements - Very subtle */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-100/20 dark:bg-orange-500/5 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-amber-100/20 dark:bg-amber-500/5 blur-3xl" />
    </motion.div>
  );
};
