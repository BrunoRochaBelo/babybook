import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MOMENT_CATALOG } from "@/data/momentCatalog";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useMoments } from "@/hooks/api";
import type { Moment } from "@babybook/contracts";

const EMPTY_MESSAGE =
  "Cadastre uma criança para navegar pelos capítulos da Jornada guiada.";

const getStatusLabel = (moments: Moment[], templateKey: string) => {
  const published = moments.find(
    (moment) => moment.templateKey === templateKey && moment.status === "published",
  );
  if (published) {
    return { label: "Preenchido", tone: "text-moss", state: "filled" as const };
  }

  const draft = moments.find(
    (moment) => moment.templateKey === templateKey && moment.status === "draft",
  );
  if (draft) {
    return { label: "Em andamento", tone: "text-accent", state: "draft" as const };
  }

  return {
    label: "Não iniciado",
    tone: "text-muted-foreground",
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
        <p className="text-lg font-semibold text-ink">
          Capítulo não encontrado. Volte para a Jornada e selecione um capítulo válido.
        </p>
        <button
          className="mt-6 rounded-2xl border border-ink/40 px-4 py-2 text-sm font-medium text-ink hover:border-ink"
          onClick={() => navigate("/jornada")}
        >
          Voltar para Jornada
        </button>
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 text-center text-muted-foreground">
        <p>{EMPTY_MESSAGE}</p>
        <button
          className="mt-6 rounded-2xl border border-ink/40 px-4 py-2 text-sm font-medium text-ink hover:border-ink"
          onClick={() => navigate("/perfil-usuario")}
        >
          Abrir configurações da conta
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
      <button
        onClick={() => navigate(-1)}
        className="text-sm font-semibold text-muted-foreground transition hover:text-ink"
      >
        ← Voltar
      </button>

      <div className="mt-4 rounded-3xl border border-sage/80 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {chapter.title}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink">{chapter.subtitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{chapter.range}</p>
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
              className="w-full rounded-3xl border border-sage/70 bg-white p-5 text-left shadow-sm transition hover:border-ink"
              disabled={isLoading}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {momentTemplate.type === "recurring" ? "Recorrente" : "Único"}
                  </p>
                  <h3 className="font-serif text-xl text-ink">{momentTemplate.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {momentTemplate.prompt}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${status.tone}`}>{status.label}</p>
                  {count > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {count} entradas preenchidas
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
