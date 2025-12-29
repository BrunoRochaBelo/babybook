import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MOMENT_CATALOG } from "@/data/momentCatalog";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useMoments } from "@/hooks/api";
import type { Moment } from "@babybook/contracts";

const getStatusLabel = (moments: Moment[], templateKey: string) => {
  const published = moments.find(
    (moment) => moment.templateKey === templateKey && moment.status === "published",
  );
  if (published) {
    return {
      label: "Preenchido",
      color: "var(--bb-color-success)",
      state: "filled" as const,
    };
  }

  const draft = moments.find(
    (moment) => moment.templateKey === templateKey && moment.status === "draft",
  );
  if (draft) {
    return {
      label: "Em andamento",
      color: "var(--bb-color-accent)",
      state: "draft" as const,
    };
  }

  return {
    label: "Não iniciado",
    color: "var(--bb-color-ink-muted)",
    state: "empty" as const,
  };
};

export const ChapterMomentsPage = () => {
  const navigate = useNavigate();
  const { chapterId } = useParams<{ chapterId: string }>();
  const { selectedChild } = useSelectedChild();
  const { data: moments = [], isLoading } = useMoments(selectedChild?.id);

  const chapter = useMemo(
    () => MOMENT_CATALOG.find((item) => item.id === chapterId),
    [chapterId],
  );

  if (!chapter) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p
          className="text-lg font-semibold"
          style={{ color: "var(--bb-color-ink)" }}
        >
          Capítulo não encontrado. Volte para a Jornada e selecione um capítulo válido.
        </p>
        <button
          className="mt-6 rounded-2xl border px-4 py-2 text-sm font-medium transition"
          style={{
            borderColor: "var(--bb-color-border)",
            color: "var(--bb-color-ink)",
          }}
          onClick={() => navigate("/jornada")}
        >
          Voltar para Jornada
        </button>
      </div>
    );
  }

  const handleMomentClick = (templateId: string, templateKey: string) => {
    const filledMoment = moments
      .filter((moment) => moment.templateKey === templateKey)
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

    const published = filledMoment.find((moment) => moment.status === "published");

    if (published) {
      navigate(`/jornada/moment/${published.id}`);
      return;
    }

    const draft = filledMoment.find((moment) => moment.status === "draft");
    if (draft) {
      navigate(`/jornada/moment/draft/${templateId}`);
      return;
    }

    navigate(`/jornada/moment/draft/${templateId}`);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate("/jornada/capitulos")}
          className="text-sm font-semibold transition"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          ← Voltar para catálogo
        </button>
      </div>

      <div
        className="mt-4 rounded-3xl border p-6 shadow-sm"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <p
          className="text-xs uppercase tracking-[0.3em]"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          {chapter.title}
        </p>
        <h1
          className="mt-2 font-serif text-3xl"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {chapter.subtitle}
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          {chapter.range}
        </p>
        <p
          className="mt-3 text-sm"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          Esta visão mostra todos os placeholders deste capítulo para que você saiba
          exatamente o que pode preencher. Clique em um momento para iniciar ou
          continuar o registro.
        </p>
      </div>
      <div className="mt-8 space-y-4">
        {chapter.moments.map((momentTemplate) => {
          const status = getStatusLabel(moments, momentTemplate.templateKey);
          const relatedMoments = moments.filter(
            (moment) => moment.templateKey === momentTemplate.templateKey,
          );
          const count = relatedMoments.filter((moment) => moment.status === "published").length;

          return (
            <button
              key={momentTemplate.id}
              type="button"
              onClick={() =>
                handleMomentClick(momentTemplate.id, momentTemplate.templateKey)
              }
              className="w-full rounded-3xl border p-5 text-left shadow-sm transition"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
              }}
              disabled={isLoading}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p
                    className="text-xs uppercase tracking-[0.3em]"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                  >
                    {momentTemplate.type === "recurring" ? "Recorrente" : "Único"}
                  </p>
                  <h3
                    className="font-serif text-xl"
                    style={{ color: "var(--bb-color-ink)" }}
                  >
                    {momentTemplate.title}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                  >
                    {momentTemplate.prompt}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: status.color }}
                  >
                    {status.label}
                  </p>
                  {count > 0 && (
                    <p
                      className="text-xs"
                      style={{ color: "var(--bb-color-ink-muted)" }}
                    >
                      {count} entrada(s) preenchida(s)
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
