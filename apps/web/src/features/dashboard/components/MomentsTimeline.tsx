import React, { useMemo, useState } from "react";
import type { Moment } from "@babybook/contracts";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MOMENT_CATALOG } from "@/data/momentCatalog";
import { MomentCard } from "@/components/MomentCard";
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
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");

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

  const hasMoments = moments && moments.length > 0;

  const renderSkeletons = () => (
    <div className="mt-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-32 rounded-3xl border border-sage/60 bg-white shadow-sm"
        />
      ))}
    </div>
  );

  const renderTimelineView = () => {
    if (!hasMoments) {
      return (
        <div className="mt-6 rounded-3xl border border-dashed border-sage/80 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Nenhum momento publicado ainda. Use o HUD ou crie um momento livre
            para iniciar a história.
          </p>
          <button
            onClick={handleCreateAvulso}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90"
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

  const renderChaptersView = () => (
    <div className="mt-6 space-y-4">
      {chapterProgress.map((chapter) => (
        <div
          key={chapter.id}
          className="rounded-3xl border border-sage/70 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {chapter.title}
              </p>
              <h4 className="mt-1 font-serif text-xl text-ink">
                {chapter.subtitle}
              </h4>
              <p className="text-sm text-muted-foreground">{chapter.range}</p>
            </div>
            <div className="text-right">
              <p className="font-serif text-3xl text-ink">
                {chapter.completed}
                <span className="text-muted-foreground">/{chapter.total}</span>
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                momentos
              </p>
            </div>
          </div>
          <div className="mt-4 h-1.5 rounded-full bg-sage/50">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${chapter.progressPercent}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`/jornada/capitulos/${chapter.id}`)}
              className="rounded-2xl border border-sage/80 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink"
            >
              Abrir capítulo
            </button>
            {chapter.nextMoment && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/jornada/moment/draft/${chapter.nextMoment?.id}`)
                }
                className="flex-1 rounded-2xl border border-dashed border-sage/80 px-4 py-2 text-left transition hover:border-ink"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Próximo do capítulo
                </p>
                <p className="font-semibold text-ink">
                  {chapter.nextMoment.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {chapter.nextMoment.prompt}
                </p>
              </button>
            )}
          </div>
          {!chapter.nextMoment && (
            <button
              type="button"
              className="mt-3 w-full rounded-2xl border border-dashed border-sage/70 px-4 py-3 text-sm font-semibold text-moss"
              onClick={() => navigate(`/jornada/capitulos/${chapter.id}`)}
            >
              Capítulo completo! 🙌
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <section className="mb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Linha do tempo guiada
          </p>
          <h3 className="font-serif text-2xl text-ink">
            Capítulos & registros
          </h3>
        </div>
        <div className="rounded-2xl border border-sage/80 bg-white p-1 shadow-sm">
          {(["timeline", "chapters"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-medium transition",
                viewMode === mode
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-ink",
              )}
            >
              {mode === "timeline" ? "Timeline" : "Capítulos"}
            </button>
          ))}
        </div>
      </div>

      {isLoading
        ? renderSkeletons()
        : viewMode === "timeline"
          ? renderTimelineView()
          : renderChaptersView()}
    </section>
  );
};
