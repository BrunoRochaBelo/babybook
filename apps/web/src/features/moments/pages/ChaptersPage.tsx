import React from "react";
import { useNavigate } from "react-router-dom";
import { NotebookPen } from "lucide-react";
import { MOMENT_CATALOG } from "@/data/momentCatalog";

export const ChaptersPage = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <button
        type="button"
        onClick={() => navigate("/jornada")}
        className="mb-6 flex items-center gap-2 text-sm font-semibold transition text-[var(--bb-color-ink-muted)] hover:text-[var(--bb-color-ink)]"
      >
        <span className="text-lg">←</span> Voltar para Jornada
      </button>

      {/* Standardized HUD Header */}
      <div className="mb-8 relative overflow-hidden rounded-2xl shadow-sm border border-orange-200/50 dark:border-stone-800 bg-gradient-to-br from-amber-100 via-orange-50 to-orange-200 dark:from-[#1c1917] dark:via-[#2c2018] dark:to-[#1c1917] p-6 text-center">
         <div className="relative z-10">
            <h1 className="font-serif text-3xl font-bold text-[var(--bb-color-ink)] dark:text-orange-50">
                Capítulos
            </h1>
            <p className="mt-2 text-sm text-[var(--bb-color-ink-muted)] dark:text-stone-400">
                Explore sua jornada guiada passo a passo.
            </p>
         </div>
         {/* Decorative background elements */}
         <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-300/30 dark:bg-orange-500/10 blur-3xl opacity-50" />
         <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-amber-300/30 dark:bg-amber-500/10 blur-3xl opacity-50" />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {MOMENT_CATALOG.map((chapter) => (
          <article
            key={chapter.id}
            className="flex flex-col rounded-3xl border p-6 shadow-sm"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              borderColor: "var(--bb-color-border)",
            }}
          >
            <div className="flex items-start gap-3">
              <NotebookPen
                className="h-8 w-8"
                style={{ color: "var(--bb-color-accent)" }}
              />
              <div>
                <p
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  {chapter.title}
                </p>
                <h2
                  className="mt-1 font-serif text-2xl"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  {chapter.subtitle}
                </h2>
                <p
                  className="text-sm"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  {chapter.range}
                </p>
              </div>
            </div>
            <p
              className="mt-4 text-sm"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              {chapter.moments.length} momentos guiados compõem este capítulo.
            </p>

            <div
              className="mt-5 flex-1 rounded-2xl border border-dashed p-4 text-sm"
              style={{
                backgroundColor: "var(--bb-color-bg)",
                borderColor: "var(--bb-color-border)",
                color: "var(--bb-color-ink-muted)",
              }}
            >
              {chapter.moments.slice(0, 4).map((moment) => (
                <div key={moment.id} className="flex items-center gap-2 pb-2 last:pb-0">
                  <span
                    className="text-xs uppercase tracking-[0.3em]"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                  >
                    {moment.type === "recurring" ? "Recorrente" : "Único"}
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: "var(--bb-color-ink)" }}
                  >
                    {moment.title}
                  </span>
                </div>
              ))}
              {chapter.moments.length > 4 && (
                <p
                  className="pt-2 text-xs"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  + {chapter.moments.length - 4} outros momentos dentro do capítulo
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(`/jornada/capitulos/${chapter.id}`)}
              className="mt-6 rounded-2xl px-4 py-2 text-sm font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: "var(--bb-color-accent)",
                color: "var(--bb-color-surface)",
              }}
            >
              Entrar no capítulo
            </button>
          </article>
        ))}
      </div>
    </div>
  );
};
