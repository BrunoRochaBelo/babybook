import React, { useMemo, useState } from "react";
import type { Moment } from "@babybook/contracts";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MOMENT_CATALOG } from "@/data/momentCatalog";
import { MomentCard } from "@/components/MomentCard";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { cn } from "@/lib/utils";

interface MomentsTimelineProps {
  moments: Moment[];
  isLoading: boolean;
}

type ViewMode = "timeline" | "chapters";

export const MomentsTimeline = ({
  moments,
  isLoading,
}: MomentsTimelineProps) => {
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  const publishedTemplateKeys = useMemo(
    () =>
      new Set(
        (moments ?? [])
          .filter((moment) => moment.status === "published")
          .map((moment) => moment.templateKey)
          .filter((templateKey): templateKey is string => Boolean(templateKey)),
      ),
    [moments],
  );

  const chapterProgress = useMemo(
    () =>
      MOMENT_CATALOG.map((chapter) => {
        const total = chapter.moments.length;
        const completed = chapter.moments.filter((moment) =>
          publishedTemplateKeys.has(moment.templateKey),
        ).length;
        const nextMoment = chapter.moments.find(
          (moment) => !publishedTemplateKeys.has(moment.templateKey),
        );
        const progressPercent = total === 0 ? 0 : (completed / total) * 100;

        return {
          ...chapter,
          completed,
          total,
          nextMoment,
          progressPercent,
        };
      }),
    [publishedTemplateKeys],
  );

  const handleCreateAvulso = () => {
    navigate("/jornada/moment/avulso");
  };

  const handlePlaceholderClick = (templateId: string, templateKey: string) => {
    if (!selectedChild) {
      navigate("/perfil-usuario");
      return;
    }

    const related = moments
      .filter((moment) => moment.templateKey === templateKey)
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

    const published = related.find((moment) => moment.status === "published");
    if (published) {
      navigate(`/jornada/moment/${published.id}`);
      return;
    }

    const draft = related.find((moment) => moment.status === "draft");
    if (draft) {
      navigate(`/jornada/moment/draft/${templateId}`);
      return;
    }

    navigate(`/jornada/moment/draft/${templateId}`);
  };

  const hasMoments = moments && moments.length > 0;

  const renderTimeline = () => {
    if (isLoading) {
      return (
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-3xl border border-border bg-surface shadow-sm"
            />
          ))}
        </div>
      );
    }

    if (!hasMoments) {
      return (
        <div className="mt-6 rounded-3xl border border-dashed border-border bg-surface p-8 text-center shadow-sm">
          <p className="text-sm text-ink-muted">
            Nenhum momento publicado ainda. Use o HUD ou crie um momento livre para
            iniciar a história.
          </p>
          <button
            onClick={handleCreateAvulso}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-5 w-5" />
            Registrar primeiro momento
          </button>
        </div>
      );
    }

    return (
      <div className="mt-6 space-y-4">
        {moments.map((moment) => (
          <MomentCard key={moment.id} moment={moment} />
        ))}
      </div>
    );
  };

  const renderChapters = () => (
    <div className="mt-6 space-y-4">
      {chapterProgress.map((chapter) => {
        const isExpanded = expandedChapterId === chapter.id;
        return (
          <div
            key={chapter.id}
            className="rounded-3xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {chapter.title}
                </p>
                <h4 className="mt-1 font-serif text-xl text-ink">
                  {chapter.subtitle}
                </h4>
                <p className="text-sm text-ink-muted">{chapter.range}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-3xl text-ink">
                  {chapter.completed}
                  <span className="text-ink-muted">/{chapter.total}</span>
                </p>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  momentos
                </p>
              </div>
            </div>

            <div className="mt-4 h-1.5 rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${chapter.progressPercent}%` }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  setExpandedChapterId((current) =>
                    current === chapter.id ? null : chapter.id,
                  )
                }
                className={cn(
                  "rounded-2xl border border-border px-4 py-2 text-sm font-semibold transition",
                  isExpanded ? "bg-primary text-primary-foreground" : "text-ink hover:border-ink",
                )}
              >
                {isExpanded ? "Esconder momentos" : "Ver todos os momentos"}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/jornada/capitulos/${chapter.id}`)}
                className="rounded-2xl border border-dashed border-border px-4 py-2 text-xs uppercase tracking-[0.3em] text-ink-muted transition hover:border-ink"
              >
                Abrir capítulo completo
              </button>
            </div>

            {isExpanded && (
              <div className="mt-5 space-y-3">
                {chapter.moments.map((template) => {
                  const related = moments.filter(
                    (moment) => moment.templateKey === template.templateKey,
                  );
                  const publishedCount = related.filter(
                    (moment) => moment.status === "published",
                  ).length;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() =>
                        handlePlaceholderClick(template.id, template.templateKey)
                      }
                      className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-left transition hover:border-ink"
                      disabled={isLoading}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                            {template.type === "recurring" ? "Recorrente" : "Único"}
                          </p>
                          <p className="font-semibold text-ink">{template.title}</p>
                        </div>
                        <span className="text-xs text-ink-muted">
                          {publishedCount > 0
                            ? `${publishedCount} preenchido(s)`
                            : "Ainda não iniciado"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-muted">
                        {template.prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <section className="mb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            Linha do tempo guiada
          </p>
          <h3 className="font-serif text-2xl text-ink">
            {viewMode === "timeline"
              ? "Momentos publicados"
              : "Capítulos & registros"}
          </h3>
          <p className="text-sm text-ink-muted">
            {viewMode === "timeline"
              ? "A timeline mostra o que já foi preenchido. Continue registrando lembranças livres quando quiser."
              : "Este catálogo é fixo. Selecione um capítulo para ver todos os placeholders e clique em qualquer momento para começar a preencher, mesmo sem dados salvos."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-border bg-surface p-1 shadow-sm">
            {(["timeline", "chapters"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-medium transition",
                  viewMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {mode === "timeline" ? "Timeline" : "Capítulos"}
              </button>
            ))}
          </div>
          {viewMode === "chapters" && (
            <button
              type="button"
              onClick={() => navigate("/jornada/capitulos")}
              className="rounded-2xl border border-border px-4 py-2 text-sm font-medium text-ink transition hover:border-ink"
            >
              Ver catálogo completo
            </button>
          )}
        </div>
      </div>

      {viewMode === "timeline"
        ? renderTimeline()
        : isLoading
          ? null
          : renderChapters()}
    </section>
  );
};
