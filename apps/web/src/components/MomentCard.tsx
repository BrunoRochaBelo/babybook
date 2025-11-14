import type { Moment as ApiMoment } from "@babybook/contracts";
import React from "react";
import { useNavigate } from "react-router-dom";
import { getMomentByTemplateKey } from "@/data/momentCatalog";
import { cn } from "@/lib/utils";

interface MomentCardProps {
  moment: ApiMoment;
}

const extractCoverImage = (
  media: Array<{ kind?: string | null; url?: string | null }> | undefined,
) => {
  if (!media || media.length === 0) {
    return undefined;
  }
  const photo = media.find((item) => item.kind === "photo");
  return photo?.url ?? media[0]?.url;
};

const statusBadge = (status: ApiMoment["status"]) => {
  switch (status) {
    case "draft":
      return {
        label: "Rascunho",
        className: "bg-surface-muted text-ink",
      };
    case "archived":
      return {
        label: "Arquivado",
        className: "bg-muted text-ink",
      };
    default:
      return null;
  }
};

const privacyLabel = {
  private: "Privado",
  people: "Guardiões",
  public: "Link público",
} as const;

export const MomentCard = ({ moment }: MomentCardProps) => {
  const navigate = useNavigate();
  const coverImage = extractCoverImage(moment.media);
  const displayDate = moment.occurredAt ?? moment.createdAt;
  const catalogInfo = getMomentByTemplateKey(moment.templateKey ?? undefined);
  const payload = moment.payload as Record<string, unknown> | undefined;
  const summary =
    moment.summary ||
    (typeof payload?.["relato"] === "string" ? (payload["relato"] as string) : "");
  const badge = statusBadge(moment.status);

  return (
    <button
      type="button"
      onClick={() => navigate(`/jornada/moment/${moment.id}`)}
      className="flex w-full flex-col overflow-hidden rounded-[32px] border border-border bg-surface text-left shadow-sm transition hover:border-ink hover:shadow-lg"
    >
      <div className="relative h-52 w-full overflow-hidden bg-muted">
        {coverImage ? (
          <img
            src={coverImage}
            alt={moment.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">
            Sem mídia
          </div>
        )}
        {badge && (
          <span
            className={cn(
              "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold",
              badge.className,
            )}
          >
            {badge.label}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink-muted">
          {catalogInfo && <span>{catalogInfo.chapterTitle}</span>}
          <span className="h-px flex-1 bg-border" />
          <span>{privacyLabel[moment.privacy]}</span>
        </div>
        <div className="space-y-1">
          <h4 className="font-serif text-2xl text-ink">{moment.title}</h4>
          {displayDate && (
            <p className="text-sm text-ink-muted">
              {new Date(displayDate).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
        {catalogInfo?.type && (
          <span
            className={cn(
              "w-fit rounded-full px-3 py-1 text-xs font-semibold",
              catalogInfo.type === "recurring" && "bg-accent-soft text-ink",
              catalogInfo.type === "series" && "bg-muted text-ink",
              catalogInfo.type === "unique" && "bg-surface-muted text-ink",
            )}
          >
            {catalogInfo.type === "recurring"
              ? "Recorrente"
              : catalogInfo.type === "series"
                ? "Série fixa"
                : "Momento único"}
          </span>
        )}
        {summary && (
          <p className="line-clamp-2 text-sm text-ink-muted">{summary}</p>
        )}
      </div>
    </button>
  );
};
