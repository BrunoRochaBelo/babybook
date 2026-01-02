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
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Play, Edit2, Repeat, Layers, Lock, Users, Globe } from "lucide-react";
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

// Helper to calculate age string (simplified)
const calculateAge = (
  birthDateStr: string | undefined | null,
  eventDateStr: string,
) => {
  if (!birthDateStr) return null;

  const birth = new Date(birthDateStr);
  const event = new Date(eventDateStr);

  const diffTime = Math.abs(event.getTime() - birth.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Logic could be more robust (years, months, days), keeping it simple for now or matching existing logic
  if (diffDays < 30) return `${diffDays} dias`;
  const months = Math.floor(diffDays / 30.44);
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths > 0
    ? `${years} anos e ${remainingMonths} meses`
    : `${years} anos`;
};

export const EnhancedMomentCard = ({
  moment,
  compact = false,
  recurrence = null,
}: EnhancedMomentCardProps) => {
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === "owner"; // Assuming role check or similar

  const displayDate = moment.occurredAt ?? moment.createdAt;
  const ageLabel = calculateAge(selectedChild?.birthday, displayDate);
  const payload = moment.payload as Record<string, unknown> | undefined;
  const description = moment.summary || (payload?.["relato"] as string) || "";
  const media = moment.media || [];

  const heroMedia = media[0];
  const subMedia = media.slice(1, 4); // Get next 3 items

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
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative w-full flex flex-col bg-[var(--bb-color-surface)] border border-[var(--bb-color-border)] rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 mb-6",
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
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--bb-color-ink-muted)]">
            <span>
              {new Date(displayDate).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
              })}
            </span>
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
                  <span className="tracking-[0.25em]">{recurrence.label}</span>
                  <span className="opacity-70">
                    {recurrence.index}/{recurrence.total}
                  </span>
                </span>
              </>
            ) : null}
          </div>
          <h3 className="text-xl font-bold font-serif text-[var(--bb-color-ink)] mt-1 leading-tight">
            {moment.title}
          </h3>
        </div>

        {/* Privacy Icon */}
        <div className="text-[var(--bb-color-ink-muted)]">
          {React.createElement(privacyConfig[moment.privacy].icon, {
            className: "w-4 h-4",
          })}
        </div>
      </div>

      {/* Media Grid 3+1 */}
      {heroMedia && (
        <div className="w-full">
          {/* Hero Image */}
          <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
            <motion.img
              layoutId={`media-${moment.id}-${heroMedia.id}`}
              src={getMediaUrl(heroMedia)}
              alt="Hero"
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4 }}
            />
            {heroMedia.kind === "video" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group">
                <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
            )}
          </div>

          {/* Sub Grid (Only if we have more media) */}
          {subMedia.length > 0 && (
            <div className="grid grid-cols-3 gap-0.5 mt-0.5">
              {subMedia.map((item, index) => (
                <div
                  key={item.id}
                  className="relative aspect-square overflow-hidden bg-gray-100"
                >
                  <motion.img
                    layoutId={`media-${moment.id}-${item.id}`}
                    src={getMediaUrl(item, "thumb") || getMediaUrl(item)}
                    alt={`Gallery ${index}`}
                    className="w-full h-full object-cover"
                  />
                  {item.kind === "video" && (
                    <div className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white">
                      <Play className="w-3 h-3 fill-current" />
                    </div>
                  )}
                  {/* If it is the last item and there are even more */}
                  {index === 2 && media.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                      +{media.length - 4}
                    </div>
                  )}
                </div>
              ))}
              {/* Fill empty slots if less than 3 sub items? No, grid just handles it. 
                        But spec said "divided in 3". If we have 1 sub item, it takes 1/3 width? 
                        CSS grid-cols-3 does that. It's fine.
                     */}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="px-5 py-4 pb-2">
        <p className="text-[var(--bb-color-ink-muted)] text-[15px] leading-relaxed line-clamp-3">
          {description || (
            <span className="italic opacity-50">Sem descrição...</span>
          )}
        </p>
        {(description.length > 100 || media.length === 0) && (
          <button className="text-[var(--bb-color-accent)] text-xs font-bold uppercase tracking-wider mt-2">
            Ver mais
          </button>
        )}
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
            Editar
          </button>
        )}
      </div>
    </motion.div>
  );
};
