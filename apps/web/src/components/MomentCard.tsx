import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import type { Moment as ApiMoment } from "@babybook/contracts";
import { getMomentByTemplateKey } from "@/data/momentCatalog";
import { getMediaUrl } from "@/lib/media";
import { useTranslation } from "@babybook/i18n";
import { cn } from "@/lib/utils";
import { HeartBurst } from "./HeartBurst";

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

export const MomentCard = ({ moment }: MomentCardProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isLiked, setIsLiked] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLiked) {
      setIsLiked(true);
      setShowBurst(true);
    } else {
      setIsLiked(false);
    }
  };

  const statusBadge = (status: ApiMoment["status"]) => {
    switch (status) {
      case "draft":
        return {
          label: t("b2c.moments.card.status.draft"),
          style: {
            backgroundColor: "var(--bb-color-muted)",
            color: "var(--bb-color-ink)",
          },
        };
      case "archived":
        return {
          label: t("b2c.moments.card.status.archived"),
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
    private: t("b2c.moments.card.privacy.private"),
    people: t("b2c.moments.card.privacy.people"),
    public: t("b2c.moments.card.privacy.public"),
  } as const;

  const typeStyles = {
    recurring: {
      backgroundColor: "var(--bb-color-accent-soft)",
      color: "var(--bb-color-ink)",
      label: t("b2c.moments.card.type.recurring"),
    },
    series: {
      backgroundColor: "var(--bb-color-muted)",
      color: "var(--bb-color-ink)",
      label: t("b2c.moments.card.type.series"),
    },
    unique: {
      backgroundColor: "var(--bb-color-surface)",
      color: "var(--bb-color-ink)",
      label: t("b2c.moments.card.type.unique"),
    },
  };

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

  return (
    <button
      type="button"
      onClick={() => navigate(`/jornada/moment/${moment.id}`)}
      className="group flex w-full flex-col overflow-hidden rounded-[32px] text-left shadow-sm transition-all duration-300 hover:shadow-lg active:scale-[0.99]"
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
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-sm"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            {t("b2c.moments.card.noMedia.title")}
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
        
        <div className="absolute right-3 top-3 z-10">
          <HeartBurst isActive={showBurst} onComplete={() => setShowBurst(false)} />
          <button
            onClick={handleLike}
            className={cn(
              "rounded-full p-2 transition-all active:scale-75 backdrop-blur-md",
              isLiked 
                ? "bg-rose-100 text-rose-500" 
                : "bg-black/20 text-white hover:bg-black/30"
            )}
          >
            <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
          </button>
        </div>
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
              {new Date(displayDate).toLocaleDateString(i18n.language)}
            </p>
          )}
        </div>
        {catalogInfo?.type && (
          <span
            className="w-fit rounded-full px-3 py-1 text-xs font-semibold"
            style={typeStyles[catalogInfo.type]}
          >
            {typeStyles[catalogInfo.type].label}
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
