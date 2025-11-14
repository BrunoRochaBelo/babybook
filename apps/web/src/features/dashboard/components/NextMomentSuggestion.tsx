import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import type { CatalogSequenceItem } from "@/data/momentCatalog";
import { cn } from "@/lib/utils";

interface NextMomentSuggestionProps {
  template: CatalogSequenceItem | null;
  childName?: string;
  hasBirthday: boolean;
}

const HudCard = ({ children }: { children: React.ReactNode }) => (
  <section className="mb-8 rounded-[32px] border border-border bg-surface p-6 shadow-[0_30px_80px_rgba(42,42,42,0.08)]">
    {children}
  </section>
);

export const NextMomentSuggestion = ({
  template,
  childName,
  hasBirthday,
}: NextMomentSuggestionProps) => {
  const navigate = useNavigate();

  if (!childName) {
    return (
      <HudCard>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
          HUD • próxima ação
        </p>
        <h2 className="mt-2 font-serif text-3xl text-ink">Sua Jornada</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Cadastre o perfil da criança para liberar o HUD e seguir o roteiro
          guiado do primeiro ano.
        </p>
        <button
          onClick={() => navigate("/jornada/perfil-crianca")}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink hover:text-accent"
        >
          Cadastrar criança
          <ArrowRight className="h-4 w-4" />
        </button>
      </HudCard>
    );
  }

  if (!hasBirthday) {
    return (
      <HudCard>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
          HUD • próxima ação
        </p>
        <h2 className="mt-2 font-serif text-3xl text-ink">Sua Jornada</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Adicione a data de nascimento de {childName} para que o HUD indique o
          próximo capítulo recomendado.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/jornada/perfil-crianca")}
            className="inline-flex items-center gap-2 rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink hover:text-accent"
          >
            Definir data agora
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate("/perfil-usuario")}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-ink-muted hover:text-ink"
          >
            Revisar depois
          </button>
        </div>
      </HudCard>
    );
  }

  if (!template) {
    return (
      <HudCard>
        <div className="flex items-center gap-2 text-ink-muted">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.3em]">
            Jornada completa
          </span>
        </div>
        <h2 className="mt-3 font-serif text-3xl text-ink">
          Parabéns! O primeiro ano está todo registrado.
        </h2>
        <p className="mt-3 text-sm text-ink-muted">
          Continue alimentando o livro com momentos avulsos ou convide a
          família para escrever no Livro de Visitas.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/jornada/moment/avulso")}
            className="inline-flex min-w-[200px] flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Criar momento avulso
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate("/visitas")}
            className="inline-flex min-w-[180px] flex-1 items-center justify-center rounded-2xl border border-border px-5 py-3 text-sm font-medium text-ink transition hover:border-ink hover:text-accent"
          >
            Abrir livro de visitas
          </button>
        </div>
      </HudCard>
    );
  }

  const handleStartTemplate = () => {
    navigate(`/jornada/moment/draft/${template.id}`);
  };

  return (
    <HudCard>
      <div className="flex items-center gap-2 text-ink-muted">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs uppercase tracking-[0.3em]">
          HUD • próxima ação
        </span>
      </div>
      <h2 className="mt-3 font-serif text-3xl text-ink">Sua Jornada</h2>
      <p className="text-sm text-ink-muted">
        Acompanhamos você capítulo a capítulo para evitar a página em branco.
      </p>
      <div
        className="mt-6 rounded-3xl px-6 py-5 text-white"
        style={{
          background: `linear-gradient(135deg, ${template.chapterAccent}, #F2995D)`,
        }}
      >
        <p className="text-xs uppercase tracking-[0.4em] text-white/80">
          Próxima sugestão • {template.chapterTitle}
        </p>
        <h3 className="mt-2 font-serif text-2xl">{template.title}</h3>
        <p className="mt-2 text-sm text-white/90">{template.prompt}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
          <span>{template.chapterSubtitle}</span>
          <span className="h-px flex-1 bg-white/40" />
          <span>{template.range}</span>
        </div>
        <button
          onClick={handleStartTemplate}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white/90 px-5 py-2 text-sm font-semibold text-ink transition hover:bg-white"
        >
          Começar agora
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-ink-muted">
        <button
          onClick={() => navigate("/momentos")}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:text-accent",
          )}
        >
          Ver momentos preenchidos
        </button>
        <button
          onClick={() => navigate("/jornada/moment/avulso")}
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink"
        >
          Criar momento livre
        </button>
      </div>
    </HudCard>
  );
};
