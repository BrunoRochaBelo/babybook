import React, { useMemo, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import type { Moment } from "@babybook/contracts";
import { List, Grid2X2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MOMENT_CATALOG, type CatalogSequenceItem } from "@/data/momentCatalog";
import { EnhancedMomentCard } from "@/components/EnhancedMomentCard";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
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
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(
    null,
  );
  const [chaptersLayout, setChaptersLayout] = useState<ChaptersLayout>("list");

  // Scroll restoration - preserves position when navigating back
  useScrollRestoration({ key: "moments-timeline", delay: 100 });

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
              className="h-32 rounded-3xl border shadow-sm"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
              }}
            />
          ))}
        </div>
      );
    }

    if (!hasMoments) {
      return (
        <div
          className="mt-6 rounded-3xl border border-dashed p-8 text-center shadow-sm"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
            Nenhum momento publicado ainda. Use o HUD ou crie um momento livre
            para iniciar a história.
          </p>
          <button
            onClick={handleCreateAvulso}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold transition hover:opacity-90"
            style={{
              backgroundColor: "var(--bb-color-accent)",
              color: "var(--bb-color-surface)",
            }}
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
          <EnhancedMomentCard key={moment.id} moment={moment} />
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
              className="rounded-3xl border p-5 shadow-sm"
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
              <h4
                className="mt-1 font-serif text-xl"
                style={{ color: "var(--bb-color-ink)" }}
              >
                {chapter.subtitle}
              </h4>
              <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
                {chapter.range}
              </p>
              <div
                className="mt-4 h-1.5 rounded-full"
                style={{ backgroundColor: "var(--bb-color-muted)", opacity: 0.4 }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: "var(--bb-color-accent)",
                    width: `${chapter.progressPercent}%`,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setExpandedChapterId(chapter.id)}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition"
                style={{
                  borderColor: "var(--bb-color-border)",
                  color: "var(--bb-color-ink)",
                }}
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
              className="rounded-3xl border p-5 shadow-sm"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p
                    className="text-xs uppercase tracking-[0.3em]"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                  >
                    {chapter.title}
                  </p>
                  <h4
                    className="mt-1 font-serif text-xl"
                    style={{ color: "var(--bb-color-ink)" }}
                  >
                    {chapter.subtitle}
                  </h4>
                  <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
                    {chapter.range}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-3xl" style={{ color: "var(--bb-color-ink)" }}>
                    {chapter.completed}
                    <span style={{ color: "var(--bb-color-ink-muted)" }}>/{chapter.total}</span>
                  </p>
                  <p
                    className="text-xs uppercase tracking-[0.3em]"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                  >
                    momentos
                  </p>
                </div>
              </div>

              <div
                className="mt-4 h-1.5 rounded-full"
                style={{ backgroundColor: "var(--bb-color-muted)", opacity: 0.4 }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: "var(--bb-color-accent)",
                    width: `${chapter.progressPercent}%`,
                  }}
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
                  className="rounded-2xl border px-4 py-2 text-sm font-semibold transition"
                  style={
                    isExpanded
                      ? {
                          backgroundColor: "var(--bb-color-accent)",
                          color: "var(--bb-color-surface)",
                          borderColor: "var(--bb-color-accent)",
                        }
                      : {
                          borderColor: "var(--bb-color-border)",
                          color: "var(--bb-color-ink)",
                        }
                  }
                >
                  {isExpanded ? "Esconder momentos" : "Ver todos os momentos"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/jornada/capitulos/${chapter.id}`)}
                  className="rounded-2xl border border-dashed px-4 py-2 text-xs uppercase tracking-[0.3em] transition"
                  style={{
                    borderColor: "var(--bb-color-border)",
                    color: "var(--bb-color-ink-muted)",
                  }}
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
                          handlePlaceholderClick(
                            template.id,
                            template.templateKey,
                          )
                        }
                        className="w-full rounded-2xl border px-4 py-3 text-left transition"
                        style={{
                          backgroundColor: "var(--bb-color-surface)",
                          borderColor: "var(--bb-color-border)",
                        }}
                        disabled={isLoading}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p
                              className="text-xs uppercase tracking-[0.3em]"
                              style={{ color: "var(--bb-color-ink-muted)" }}
                            >
                              {template.type === "recurring"
                                ? "Recorrente"
                                : "Único"}
                            </p>
                            <p
                              className="font-semibold"
                              style={{ color: "var(--bb-color-ink)" }}
                            >
                              {template.title}
                            </p>
                          </div>
                          <span
                            className="text-xs"
                            style={{ color: "var(--bb-color-ink-muted)" }}
                          >
                            {publishedCount > 0
                              ? `${publishedCount} preenchido(s)`
                              : "Ainda não iniciado"}
                          </span>
                        </div>
                        <p
                          className="mt-1 text-sm"
                          style={{ color: "var(--bb-color-ink-muted)" }}
                        >
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
        <h3
          className="font-serif text-2xl"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {viewMode === "timeline"
            ? "Momentos publicados"
            : "Capítulos & registros"}
        </h3>
      </div>
      <div className="mt-5 flex justify-center">
        <div
          className="w-full max-w-3xl rounded-[32px] border p-2 shadow-sm"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
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
                    )}
                    style={{
                      color: isActive
                        ? "var(--bb-color-surface)"
                        : "var(--bb-color-ink-muted)",
                    }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="journey-view-pill"
                        className="absolute inset-0 rounded-[28px]"
                        style={{
                          backgroundColor: "var(--bb-color-accent)",
                          boxShadow: "0 10px 24px rgba(242,153,93,0.28)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 320,
                          damping: 30,
                        }}
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
              className="inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm font-semibold transition"
              style={
                chaptersLayout === "list"
                  ? {
                      backgroundColor: "var(--bb-color-ink)",
                      color: "var(--bb-color-surface)",
                      borderColor: "var(--bb-color-ink)",
                    }
                  : {
                      borderColor: "var(--bb-color-border)",
                      color: "var(--bb-color-ink)",
                    }
              }
            >
              <List className="h-4 w-4" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setChaptersLayout("grid")}
              className="inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm font-semibold transition"
              style={
                chaptersLayout === "grid"
                  ? {
                      backgroundColor: "var(--bb-color-ink)",
                      color: "var(--bb-color-surface)",
                      borderColor: "var(--bb-color-ink)",
                    }
                  : {
                      borderColor: "var(--bb-color-border)",
                      color: "var(--bb-color-ink)",
                    }
              }
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
