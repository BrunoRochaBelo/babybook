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
        className="mb-6 text-sm font-semibold transition"
        style={{ color: "var(--bb-color-ink-muted)" }}
      >
        ← Voltar para Jornada
      </button>
      <div
        className="rounded-3xl border p-8 shadow-sm"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <div
          className="flex items-center gap-3"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-xs uppercase tracking-[0.3em]">
            Catálogo oficial • Linha do tempo guiada
          </span>
        </div>
        <h1
          className="mt-3 font-serif text-4xl"
          style={{ color: "var(--bb-color-ink)" }}
        >
          Capítulos & registros
        </h1>
        <p
          className="mt-3 text-base"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          Estes são os capítulos fixos do Baby Book. Use esta visão para planejar
          o preenchimento da jornada — cada capítulo lista todos os momentos que o
          compõem, mesmo que ainda não tenham conteúdo.
        </p>
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
