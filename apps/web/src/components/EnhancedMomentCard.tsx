/**
 * EnhancedMomentCard - Standard 3+1 Layout
 *
 * Refactored to match "Book 1: The Journey" new requirements.
 * Layout:
 * - Header: Date + Age + Title
 * - Media: 3+1 Grid (Hero + 3 thumbs)
 * - Body: Truncated text
 * - Footer: Edit button (Owner only)
 */

import type { Moment as ApiMoment } from "@babybook/contracts";
import React from "react";
import { useTranslation } from "@babybook/i18n";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Play,
  Edit2,
  Repeat,
  Layers,
  Lock,
  Users,
  Globe,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { getMomentByTemplateKey } from "@/data/momentCatalog";
import { getMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useAuthStore } from "@/store/auth";

interface EnhancedMomentCardProps {
  moment: ApiMoment;
  compact?: boolean;
  recurrence?: {
    kind: "recurring" | "series";
    label: string;
    index: number;
    total: number;
  } | null;
}

const privacyConfig = {
  private: { icon: Lock, label: "Privado" },
  people: { icon: Users, label: "Guardiões" },
  public: { icon: Globe, label: "Público" },
} as const;

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return null;
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
};

const formatDayMonth = (dateStr: string, locale: string) => {
  const value = new Date(dateStr);
  const raw = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
  }).format(value);

  // PT-BR tende a vir em minúsculas (ex.: "12 de março").
  // Mantém o formato natural do locale, só capitaliza o mês quando fizer sentido.
  if (locale.toLowerCase().startsWith("pt")) {
    const parts = raw.split(" de ");
    if (parts.length === 2) {
      const [day, month] = parts;
      return `${day} de ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
    }
  }

  return raw;
};

const looksLikeVideoUrl = (value?: string) =>
  typeof value === "string" && /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(value);

const safeImageUrl = (value?: string) => {
  if (!value) return undefined;
  return looksLikeVideoUrl(value) ? undefined : value;
};

const clampDateToUTCStart = (date: Date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const diffDaysUTC = (from: Date, to: Date) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor(
    (clampDateToUTCStart(to) - clampDateToUTCStart(from)) / msPerDay,
  );
};

const addMonthsClamped = (date: Date, months: number) => {
  const originalDay = date.getUTCDate();
  const baseYear = date.getUTCFullYear();
  const baseMonth = date.getUTCMonth();

  const firstOfTarget = new Date(Date.UTC(baseYear, baseMonth + months, 1));
  const targetYear = firstOfTarget.getUTCFullYear();
  const targetMonth = firstOfTarget.getUTCMonth();
  const lastDay = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate();

  return new Date(
    Date.UTC(targetYear, targetMonth, Math.min(originalDay, lastDay)),
  );
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

// Idade no formato “3 meses e 2 dias” (ou “12 dias”, “1 ano e 3 meses”, etc.)
const calculateAge = (
  birthDateStr: string | undefined | null,
  eventDateStr: string,
  t: TranslateFn,
) => {
  if (!birthDateStr) return null;

  const birth = new Date(birthDateStr);
  const event = new Date(eventDateStr);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(event.getTime()))
    return null;
  if (event.getTime() < birth.getTime()) return null;

  let totalMonths =
    (event.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    (event.getUTCMonth() - birth.getUTCMonth());

  const candidate = addMonthsClamped(birth, totalMonths);
  if (candidate.getTime() > event.getTime()) {
    totalMonths = Math.max(0, totalMonths - 1);
  }

  const anchor = addMonthsClamped(birth, totalMonths);
  const days = Math.max(0, diffDaysUTC(anchor, event));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const parts: string[] = [];
  if (years > 0) parts.push(t("b2c.moments.card.age.years", { count: years }));
  if (months > 0)
    parts.push(t("b2c.moments.card.age.months", { count: months }));
  // Para ficar mais “humano”, inclui dias quando não há anos (ex: 3 meses e 2 dias).
  if (years === 0 && days > 0)
    parts.push(t("b2c.moments.card.age.days", { count: days }));
  if (parts.length === 0) return t("b2c.moments.card.age.days", { count: 0 });

  return parts.slice(0, 2).join(` ${t("common.and")} `);
};

const extractExtraHeaderInfo = (moment: ApiMoment) => {
  const catalog = getMomentByTemplateKey(moment.templateKey ?? undefined);
  const payload = moment.payload as Record<string, unknown> | undefined;
  const fields = catalog?.fields ?? [];
  if (!payload || fields.length === 0) return null;

  const out: string[] = [];

  for (const field of fields) {
    if (out.length >= 2) break;
    const raw = payload[field.key];
    if (raw === null || raw === undefined) continue;

    if (field.type === "textarea" || field.type === "richtext") {
      continue;
    }

    if (field.type === "tags") {
      const value = Array.isArray(raw)
        ? raw.filter((v) => typeof v === "string").join(", ")
        : typeof raw === "string"
          ? raw
          : "";
      if (value) out.push(`${field.label}: ${value}`);
      continue;
    }

    if (field.type === "date" || field.type === "datetime") {
      const value = typeof raw === "string" ? raw : "";
      if (!value) continue;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) continue;
      out.push(
        `${field.label}: ${d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}`,
      );
      continue;
    }

    if (typeof raw === "string") {
      const value = raw.trim();
      if (!value) continue;
      out.push(`${field.label}: ${value}`);
      continue;
    }

    if (typeof raw === "number") {
      out.push(`${field.label}: ${raw}`);
      continue;
    }
  }

  return out.length > 0 ? out.join(" • ") : null;
};

export const EnhancedMomentCard = ({
  moment,
  compact = false,
  recurrence = null,
}: EnhancedMomentCardProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === "owner"; // Assuming role check or similar

  const [expandedText, setExpandedText] = React.useState(false);
  const [activeMediaId, setActiveMediaId] = React.useState<string | null>(null);

  const displayDate = moment.occurredAt ?? moment.createdAt;
  const locale = i18n?.language || "pt-BR";
  const ageLabel = calculateAge(selectedChild?.birthday, displayDate, t);
  const payload = moment.payload as Record<string, unknown> | undefined;
  const description = moment.summary || (payload?.["relato"] as string) || "";
  const media = moment.media || [];

  const headerExtra = extractExtraHeaderInfo(moment);

  const photos = media.filter((m) => m.kind === "photo");
  const videos = media.filter((m) => m.kind === "video");

  // Hero privilegia foto (quando existir).
  const heroMedia = photos[0] ?? media[0];
  const bottomPhotos = photos.filter((m) => m.id !== heroMedia?.id).slice(0, 2);
  const bottomVideo = videos[0] ?? null;
  const thirdTile =
    bottomVideo ??
    photos.filter((m) => m.id !== heroMedia?.id).slice(2, 3)[0] ??
    null;

  const displayedMediaIds = new Set(
    [
      heroMedia?.id,
      bottomPhotos[0]?.id,
      bottomPhotos[1]?.id,
      thirdTile?.id,
    ].filter(Boolean) as string[],
  );

  const remainingCount = Math.max(0, media.length - displayedMediaIds.size);

  const activeMedia = activeMediaId
    ? (media.find((m) => m.id === activeMediaId) ?? null)
    : null;

  const navigableMedia = React.useMemo(
    () => media.filter((m) => m.kind === "photo" || m.kind === "video"),
    [media],
  );

  const activeNavIndex = React.useMemo(() => {
    if (!activeMediaId) return -1;
    return navigableMedia.findIndex((m) => m.id === activeMediaId);
  }, [activeMediaId, navigableMedia]);

  const canNavigate = navigableMedia.length > 1 && activeNavIndex >= 0;

  const goToNavIndex = React.useCallback(
    (index: number) => {
      if (navigableMedia.length === 0) return;
      const normalized =
        ((index % navigableMedia.length) + navigableMedia.length) %
        navigableMedia.length;
      setActiveMediaId(navigableMedia[normalized].id);
    },
    [navigableMedia],
  );

  const goPrev = React.useCallback(() => {
    if (!canNavigate) return;
    goToNavIndex(activeNavIndex - 1);
  }, [activeNavIndex, canNavigate, goToNavIndex]);

  const goNext = React.useCallback(() => {
    if (!canNavigate) return;
    goToNavIndex(activeNavIndex + 1);
  }, [activeNavIndex, canNavigate, goToNavIndex]);

  const openMedia = (id: string) => setActiveMediaId(id);
  const closeMedia = () => setActiveMediaId(null);

  React.useEffect(() => {
    if (!activeMediaId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMediaId(null);
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeMediaId, goNext, goPrev]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking specific actions (like play or edit)
    if ((e.target as HTMLElement).closest("button")) return;
    navigate(`/jornada/moment/${moment.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/jornada/moment/${moment.id}/edit`); // Adjust edit route if needed
  };

  if (compact) {
    // Fallback for compact view (if still used elsewhere)
    return <div className="aspect-square bg-gray-200 rounded-xl" />;
  }

  return (
    <LayoutGroup id={`moment-card:${moment.id}`}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative w-full flex flex-col bg-[var(--bb-color-surface)] border border-[var(--bb-color-border)] rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 mb-6",
          // Mantém o card inteiro visível (card-a-card), considerando header da página.
          "max-h-[calc(100svh-11rem)]",
        )}
        onClick={handleCardClick}
      >
        {recurrence ? (
          <div
            className="absolute left-0 top-0 h-full w-1"
            style={{
              backgroundColor:
                recurrence.kind === "recurring"
                  ? "var(--bb-color-accent)"
                  : "color-mix(in srgb, var(--bb-color-ink) 25%, transparent)",
            }}
            aria-hidden
          />
        ) : null}

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4">
          <div className="min-w-0 flex flex-col">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold uppercase tracking-wider text-[var(--bb-color-ink-muted)]">
              <span>{formatDayMonth(displayDate, locale)}</span>
              {ageLabel && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[var(--bb-color-border)]" />
                  <span>{ageLabel}</span>
                </>
              )}

              {recurrence ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-[var(--bb-color-border)]" />
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em]"
                    style={{
                      borderColor: "var(--bb-color-border)",
                      backgroundColor:
                        recurrence.kind === "recurring"
                          ? "rgba(242,153,93,0.14)"
                          : "rgba(148,163,184,0.18)",
                      color: "var(--bb-color-ink)",
                    }}
                    title={`${recurrence.label} · ${recurrence.index}/${recurrence.total}`}
                  >
                    {recurrence.kind === "recurring" ? (
                      <Repeat className="h-3 w-3" />
                    ) : (
                      <Layers className="h-3 w-3" />
                    )}
                    <span className="tracking-[0.25em]">
                      {recurrence.label}
                    </span>
                    <span className="opacity-70">
                      {recurrence.index}/{recurrence.total}
                    </span>
                  </span>
                </>
              ) : null}
            </div>

            <h3 className="text-[18px] font-bold text-[var(--bb-color-ink)] mt-1 leading-snug truncate">
              {moment.title}
            </h3>

            {headerExtra ? (
              <p
                className="mt-1 text-[13px] leading-snug truncate"
                style={{ color: "var(--bb-color-ink-muted)" }}
                title={headerExtra}
              >
                {headerExtra}
              </p>
            ) : null}
          </div>

          {/* Privacy Icon */}
          <div className="text-[var(--bb-color-ink-muted)]">
            {React.createElement(privacyConfig[moment.privacy].icon, {
              className: "w-4 h-4",
            })}
          </div>
        </div>

        {/* Media Grid 3+1 */}
        {heroMedia ? (
          <div className="w-full">
            {/* Hero Image */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openMedia(heroMedia.id);
              }}
              className="block w-full text-left"
              aria-label={t("b2c.moments.card.actions.openFeatured")}
            >
              <motion.div
                layoutId={`media-${moment.id}-${heroMedia.id}`}
                className={cn(
                  "relative w-full overflow-hidden bg-gray-100",
                  media.length <= 1
                    ? "aspect-[4/3] max-h-[min(52svh,420px)]"
                    : "aspect-[4/3] max-h-[min(42svh,340px)]",
                )}
              >
                {(() => {
                  const heroUrl =
                    heroMedia.kind === "photo"
                      ? getMediaUrl(heroMedia)
                      : safeImageUrl(
                          getMediaUrl(heroMedia, "thumb") ||
                            getMediaUrl(heroMedia, "card"),
                        );

                  if (!heroUrl) {
                    return (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                    );
                  }

                  return (
                    <img
                      src={heroUrl}
                      alt={moment.title}
                      className="w-full h-full object-cover"
                    />
                  );
                })()}
              </motion.div>
            </button>

            {/* Bottom row: 2 fotos + 1 vídeo (ou fallback)
                Se houver só 1 mídia, mostra apenas o hero por inteiro. */}
            {media.length > 1 ? (
              <div
                className={cn(
                  "grid gap-0.5 mt-0.5",
                  (() => {
                    const tiles = [
                      bottomPhotos[0] ?? null,
                      bottomPhotos[1] ?? null,
                      thirdTile,
                    ].filter(Boolean).length;

                    if (tiles <= 1) return "grid-cols-1";
                    if (tiles === 2) return "grid-cols-2";
                    return "grid-cols-3";
                  })(),
                )}
              >
                {(
                  [
                    bottomPhotos[0] ?? null,
                    bottomPhotos[1] ?? null,
                    thirdTile,
                  ].filter(Boolean) as typeof media
                ).map((item, index, arr) => {
                  const isVideoTile = item.kind === "video";
                  const thumbUrl = isVideoTile
                    ? safeImageUrl(
                        getMediaUrl(item, "thumb") || getMediaUrl(item, "card"),
                      )
                    : getMediaUrl(item, "thumb") ||
                      getMediaUrl(item, "card") ||
                      getMediaUrl(item);
                  const durationLabel = isVideoTile
                    ? formatDuration(item.durationSeconds)
                    : null;

                  const showRemainingOverlay =
                    index === arr.length - 1 && remainingCount > 0;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMedia(item.id);
                      }}
                      className="relative aspect-square overflow-hidden bg-gray-100 text-left"
                      aria-label={
                        isVideoTile
                          ? t("b2c.moments.card.actions.openVideo")
                          : t("b2c.moments.card.actions.openPhoto")
                      }
                    >
                      <motion.div
                        layoutId={`media-${moment.id}-${item.id}`}
                        className="absolute inset-0"
                      >
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={moment.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                        )}
                      </motion.div>

                      {isVideoTile ? (
                        <div className="absolute inset-0 bg-black/15">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/25 backdrop-blur-sm text-white">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                          {durationLabel ? (
                            <div className="absolute right-2 bottom-2 rounded-md bg-black/60 px-2 py-1 text-[11px] font-semibold text-white">
                              {durationLabel}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {showRemainingOverlay ? (
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            +{remainingCount}
                          </span>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="px-5">
            <div
              className={cn("rounded-2xl border p-5", "flex items-start gap-4")}
              style={{
                backgroundColor: "var(--bb-color-bg)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--bb-color-ink) 6%, transparent)",
                  color: "var(--bb-color-ink-muted)",
                }}
                aria-hidden
              >
                <ImageIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  {t("b2c.moments.card.noMedia.title")}
                </p>
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  {t("b2c.moments.card.noMedia.description")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4 pb-2 flex-1 min-h-0">
          <p
            className={cn(
              "text-[var(--bb-color-ink-muted)] text-[15px] leading-relaxed",
              expandedText ? "" : "line-clamp-3",
            )}
          >
            {description || (
              <span className="italic opacity-50">
                {t("b2c.moments.card.noDescription")}
              </span>
            )}
          </p>

          {description && description.trim().length >= 80 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedText((v) => !v);
              }}
              className="text-[var(--bb-color-accent)] text-xs font-bold uppercase tracking-wider mt-2"
            >
              {expandedText
                ? t("b2c.moments.card.actions.seeLess")
                : t("b2c.moments.card.actions.seeMore")}
            </button>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-end border-t border-[var(--bb-color-border)] mt-2">
          {/* Owner Actions */}
          {isOwner && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[var(--bb-color-bg)] text-[var(--bb-color-ink-muted)] hover:text-[var(--bb-color-ink)] transition-colors text-xs font-medium"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {t("common.edit")}
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {activeMedia ? (
            <motion.div
              key={`overlay:${moment.id}`}
              className="fixed inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMedia}
              role="dialog"
              aria-modal="true"
              aria-label={t("b2c.moments.card.dialog.label")}
            >
              <motion.div
                className="absolute inset-0 bg-black/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              <div className="absolute inset-0 flex items-center justify-center p-4">
                <motion.div
                  className="relative w-full max-w-[920px]"
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.98, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div
                    layoutId={`media-${moment.id}-${activeMedia.id}`}
                    className="overflow-hidden rounded-3xl bg-black shadow-2xl"
                  >
                    {/* Controles do fullscreen */}
                    <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeMedia}
                        aria-label={t("common.close")}
                        className={cn(
                          "inline-flex items-center justify-center rounded-full p-2",
                          "backdrop-blur-md",
                          "transition hover:opacity-90",
                        )}
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--bb-color-surface) 24%, transparent)",
                          color: "white",
                          boxShadow:
                            "0 0 0 1px rgba(255,255,255,0.18) inset, 0 10px 24px rgba(0,0,0,0.35)",
                        }}
                      >
                        <X className="h-5 w-5" aria-hidden />
                      </button>
                    </div>

                    {canNavigate ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            goPrev();
                          }}
                          aria-label={t("b2c.moments.card.actions.prevMedia")}
                          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 backdrop-blur-md transition hover:opacity-90"
                          style={{
                            backgroundColor:
                              "color-mix(in srgb, var(--bb-color-surface) 24%, transparent)",
                            color: "white",
                            boxShadow:
                              "0 0 0 1px rgba(255,255,255,0.18) inset, 0 10px 24px rgba(0,0,0,0.35)",
                          }}
                        >
                          <ChevronLeft className="h-6 w-6" aria-hidden />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            goNext();
                          }}
                          aria-label={t("b2c.moments.card.actions.nextMedia")}
                          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 backdrop-blur-md transition hover:opacity-90"
                          style={{
                            backgroundColor:
                              "color-mix(in srgb, var(--bb-color-surface) 24%, transparent)",
                            color: "white",
                            boxShadow:
                              "0 0 0 1px rgba(255,255,255,0.18) inset, 0 10px 24px rgba(0,0,0,0.35)",
                          }}
                        >
                          <ChevronRight className="h-6 w-6" aria-hidden />
                        </button>

                        <div
                          className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md"
                          style={{
                            backgroundColor:
                              "color-mix(in srgb, var(--bb-color-surface) 24%, transparent)",
                            color: "white",
                            boxShadow: "0 0 0 1px rgba(255,255,255,0.18) inset",
                          }}
                        >
                          {activeNavIndex + 1}/{navigableMedia.length}
                        </div>
                      </>
                    ) : null}

                    {activeMedia.kind === "video" ? (
                      <video
                        controls
                        preload="metadata"
                        poster={
                          getMediaUrl(activeMedia, "thumb") ||
                          getMediaUrl(activeMedia, "card") ||
                          undefined
                        }
                        src={getMediaUrl(activeMedia)}
                        className="w-full h-[min(72svh,680px)] object-contain bg-black"
                      />
                    ) : (
                      <img
                        src={getMediaUrl(activeMedia)}
                        alt={moment.title}
                        className="w-full h-[min(72svh,680px)] object-contain bg-black"
                      />
                    )}
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
};
