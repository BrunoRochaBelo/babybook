import React from "react";
import { useNavigate } from "react-router-dom";
import { NotebookPen, Sparkles } from "lucide-react";
import { MOMENT_CATALOG } from "@/data/momentCatalog";

export const ChaptersPage = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <button
        type="button"
        onClick={() => navigate("/jornada")}
        className="mb-6 text-sm font-semibold text-muted-foreground transition hover:text-ink"
      >
        ← Voltar para Jornada
      </button>
      <div className="rounded-3xl border border-sage/80 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs uppercase tracking-[0.3em]">
            Catálogo oficial • Linha do tempo guiada
          </span>
        </div>
        <h1 className="mt-3 font-serif text-4xl text-ink">Capítulos & registros</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Estes são os capítulos fixos do Baby Book. Use esta visão para planejar
          o preenchimento da jornada — cada capítulo lista todos os momentos que o
          compõem, mesmo que ainda não tenham conteúdo.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {MOMENT_CATALOG.map((chapter) => (
          <article
            key={chapter.id}
            className="flex flex-col rounded-3xl border border-sage/70 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <NotebookPen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {chapter.title}
                </p>
                <h2 className="mt-1 font-serif text-2xl text-ink">
                  {chapter.subtitle}
                </h2>
                <p className="text-sm text-muted-foreground">{chapter.range}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {chapter.moments.length} momentos guiados compõem este capítulo.
            </p>

            <div className="mt-5 flex-1 rounded-2xl border border-dashed border-sage/60 bg-sand/40 p-4 text-sm text-muted-foreground">
              {chapter.moments.slice(0, 4).map((moment) => (
                <div key={moment.id} className="flex items-center gap-2 pb-2 last:pb-0">
                  <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {moment.type === "recurring" ? "Recorrente" : "Único"}
                  </span>
                  <span className="font-semibold text-ink">{moment.title}</span>
                </div>
              ))}
              {chapter.moments.length > 4 && (
                <p className="pt-2 text-xs text-muted-foreground">
                  + {chapter.moments.length - 4} outros momentos dentro do capítulo
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(`/jornada/capitulos/${chapter.id}`)}
              className="mt-6 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Entrar no capítulo
            </button>
          </article>
        ))}
      </div>
    </div>
  );
};
