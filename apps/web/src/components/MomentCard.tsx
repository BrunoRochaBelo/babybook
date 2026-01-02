import type { Moment as ApiMoment } from "@babybook/contracts";
import { useNavigate } from "react-router-dom";
import { getMomentByTemplateKey } from "@/data/momentCatalog";
import { getMediaUrl } from "@/lib/media";

interface MomentCardProps {
  moment: ApiMoment;
}

const extractCoverImage = (media: ApiMoment["media"]) => {
  if (!media || media.length === 0) {
    return undefined;
  }
  const photo = media.find((item) => item.kind === "photo") ?? media[0];
  if (!photo) {
    return undefined;
  }
  return (
    getMediaUrl(photo, "card") ??
    getMediaUrl(photo, "thumb") ??
    getMediaUrl(photo)
  );
};

const statusBadge = (status: ApiMoment["status"]) => {
  switch (status) {
    case "draft":
      return {
        label: "Rascunho",
        style: {
          backgroundColor: "var(--bb-color-muted)",
          color: "var(--bb-color-ink)",
        },
      };
    case "archived":
      return {
        label: "Arquivado",
        style: {
          backgroundColor: "var(--bb-color-muted)",
          color: "var(--bb-color-ink)",
        },
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
    (typeof payload?.["relato"] === "string"
      ? (payload["relato"] as string)
      : "");
  const badge = statusBadge(moment.status);

  const typeStyles = {
    recurring: {
      backgroundColor: "var(--bb-color-accent-soft)",
      color: "var(--bb-color-ink)",
    },
    series: {
      backgroundColor: "var(--bb-color-muted)",
      color: "var(--bb-color-ink)",
    },
    unique: {
      backgroundColor: "var(--bb-color-surface)",
      color: "var(--bb-color-ink)",
    },
  };

  return (
    <button
      type="button"
      onClick={() => navigate(`/jornada/moment/${moment.id}`)}
      className="flex w-full flex-col overflow-hidden rounded-[32px] text-left shadow-sm transition hover:shadow-lg"
      style={{
        backgroundColor: "var(--bb-color-surface)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--bb-color-border)",
      }}
    >
      <div
        className="relative h-52 w-full overflow-hidden"
        style={{ backgroundColor: "var(--bb-color-muted)" }}
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={moment.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-sm"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            Sem mídia
          </div>
        )}
        {badge && (
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold"
            style={badge.style}
          >
            {badge.label}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 px-5 py-4">
        <div
          className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em]"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          {catalogInfo && <span>{catalogInfo.chapterTitle}</span>}
          <span
            className="h-px flex-1"
            style={{ backgroundColor: "var(--bb-color-border)" }}
          />
          <span>{privacyLabel[moment.privacy]}</span>
        </div>
        <div className="space-y-1">
          <h4
            className="font-serif text-2xl"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {moment.title}
          </h4>
          {displayDate && (
            <p
              className="text-sm"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              {new Date(displayDate).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
        {catalogInfo?.type && (
          <span
            className="w-fit rounded-full px-3 py-1 text-xs font-semibold"
            style={typeStyles[catalogInfo.type]}
          >
            {catalogInfo.type === "recurring"
              ? "Recorrente"
              : catalogInfo.type === "series"
                ? "Série fixa"
                : "Momento único"}
          </span>
        )}
        {summary && (
          <p
            className="line-clamp-2 text-sm"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            {summary}
          </p>
        )}
      </div>
    </button>
  );
};
