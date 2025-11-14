import React, { useMemo, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import type { Moment } from "@babybook/contracts";
import { List, Grid2X2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MOMENT_CATALOG, type CatalogSequenceItem } from "@/data/momentCatalog";
import { MomentCard } from "@/components/MomentCard";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { cn } from "@/lib/utils";
import { NextMomentSuggestion } from "./NextMomentSuggestion";
import { JourneyProgressCard } from "./JourneyProgressCard";

interface MomentsTimelineProps {
  moments: Moment[];
  isLoading: boolean;
  nextTemplate?: CatalogSequenceItem | null;
  childName?: string;
  hasBirthday?: boolean;
  completedCount?: number;
}

type ViewMode = "timeline" | "chapters";
type ChaptersLayout = "list" | "grid";

export const MomentsTimeline = ({
  moments,
  isLoading,
  nextTemplate = null,
  childName,
  hasBirthday = false,
  completedCount = 0,
}: MomentsTimelineProps) => {
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [chaptersLayout, setChaptersLayout] = useState<ChaptersLayout>("list");

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

  const renderChapters = () => {
    if (chaptersLayout === "grid") {
      return (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {chapterProgress.map((chapter) => (
            <div
              key={chapter.id}
              className="rounded-3xl border border-border bg-surface p-5 shadow-sm"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                {chapter.title}
              </p>
              <h4 className="mt-1 font-serif text-xl text-ink">
                {chapter.subtitle}
              </h4>
              <p className="text-sm text-ink-muted">{chapter.range}</p>
              <div className="mt-4 h-1.5 rounded-full bg-muted/40">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${chapter.progressPercent}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => setExpandedChapterId(chapter.id)}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink"
              >
                Abrir detalhes
              </button>
            </div>
          ))}
        </div>
      );
    }

    return (
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
  };

  const renderHUD = () => {
    if (viewMode === "timeline") {
      return (
        <NextMomentSuggestion
          template={nextTemplate ?? null}
          childName={childName}
          hasBirthday={hasBirthday}
        />
      );
    }

    return <JourneyProgressCard completed={completedCount} />;
  };

  return (
    <section className="mb-12">
      <div className="text-center">
        <h3 className="font-serif text-2xl text-ink">
          {viewMode === "timeline"
            ? "Momentos publicados"
            : "Capítulos & registros"}
        </h3>
      </div>
      <div className="mt-5 flex justify-center">
        <div className="w-full max-w-3xl rounded-[32px] border border-border bg-surface p-2 shadow-sm">
          <LayoutGroup id="journey-view-tabs">
            <div className="flex flex-wrap gap-2">
              {(["timeline", "chapters"] as ViewMode[]).map((mode) => {
                const isActive = viewMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "relative flex-1 min-w-[140px] overflow-hidden rounded-[28px] px-4 py-2 text-sm font-semibold transition-colors duration-300",
                      isActive
                        ? "text-primary-foreground"
                        : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="journey-view-pill"
                        className="absolute inset-0 rounded-[28px] bg-primary shadow-[0_10px_24px_rgba(242,153,93,0.28)]"
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">
                      {mode === "timeline" ? "Timeline" : "Capítulos"}
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>
      </div>

      <div className="mt-6">{renderHUD()}</div>

      <div className="mt-6">
        {viewMode === "chapters" && (
          <div className="mb-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setChaptersLayout("list")}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm font-semibold",
                chaptersLayout === "list"
                  ? "border-ink bg-ink text-surface"
                  : "border-border text-ink hover:border-ink",
              )}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setChaptersLayout("grid")}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm font-semibold",
                chaptersLayout === "grid"
                  ? "border-ink bg-ink text-surface"
                  : "border-border text-ink hover:border-ink",
              )}
            >
              <Grid2X2 className="h-4 w-4" />
              Grade
            </button>
          </div>
        )}

        {viewMode === "timeline"
          ? renderTimeline()
          : isLoading
            ? null
            : renderChapters()}
      </div>
    </section>
  );
};
