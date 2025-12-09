/**
 * EnhancedMomentCard - Timeline Card with Media Type Support
 *
 * Displays moments with visual indicators for different media types:
 * - Photo: Standard image display with lazy loading
 * - Video: Thumbnail with play indicator, auto-preview on hover
 * - Audio: Waveform visualization with play button
 * - Text: Typography-focused card with quote styling
 */

import type { Moment as ApiMoment } from "@babybook/contracts";
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Play,
  Pause,
  Image,
  Video,
  Mic,
  FileText,
  Lock,
  Users,
  Globe,
} from "lucide-react";
import { getMomentByTemplateKey } from "@/data/momentCatalog";
import { getMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

interface EnhancedMomentCardProps {
  moment: ApiMoment;
  /** Compact layout for grid views */
  compact?: boolean;
  /** Show media type indicator */
  showMediaType?: boolean;
  /** Enable video preview on hover (desktop only) */
  enableVideoPreview?: boolean;
}

type MediaType = "photo" | "video" | "audio" | "text";

function getMediaType(media: ApiMoment["media"]): MediaType {
  if (!media || media.length === 0) return "text";

  const hasVideo = media.some((item) => item.kind === "video");
  if (hasVideo) return "video";

  const hasAudio = media.some((item) => item.kind === "audio");
  if (hasAudio) return "audio";

  const hasPhoto = media.some((item) => item.kind === "photo");
  if (hasPhoto) return "photo";

  return "text";
}

function extractCoverImage(media: ApiMoment["media"]) {
  if (!media || media.length === 0) return undefined;

  const photo = media.find((item) => item.kind === "photo") ?? media[0];
  if (!photo) return undefined;

  return (
    getMediaUrl(photo, "card") ??
    getMediaUrl(photo, "thumb") ??
    getMediaUrl(photo)
  );
}

function extractVideoUrl(media: ApiMoment["media"]) {
  if (!media) return undefined;
  const video = media.find((item) => item.kind === "video");
  return video ? getMediaUrl(video) : undefined;
}

const MediaTypeIcon = ({
  type,
  className,
}: {
  type: MediaType;
  className?: string;
}) => {
  const icons = {
    photo: Image,
    video: Video,
    audio: Mic,
    text: FileText,
  };
  const Icon = icons[type];
  return <Icon className={className} />;
};

const privacyConfig = {
  private: { icon: Lock, label: "Privado" },
  people: { icon: Users, label: "Guardiões" },
  public: { icon: Globe, label: "Público" },
} as const;

const statusConfig = {
  draft: { label: "Rascunho", className: "bg-amber-100 text-amber-800" },
  archived: { label: "Arquivado", className: "bg-gray-100 text-gray-600" },
  published: null,
} as const;

export const EnhancedMomentCard = ({
  moment,
  compact = false,
  showMediaType = true,
  enableVideoPreview = true,
}: EnhancedMomentCardProps) => {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const mediaType = getMediaType(moment.media);
  const coverImage = extractCoverImage(moment.media);
  const videoUrl = extractVideoUrl(moment.media);
  const displayDate = moment.occurredAt ?? moment.createdAt;
  const catalogInfo = getMomentByTemplateKey(moment.templateKey ?? undefined);

  const payload = moment.payload as Record<string, unknown> | undefined;
  const summary =
    moment.summary ||
    (typeof payload?.["relato"] === "string"
      ? (payload["relato"] as string)
      : "");

  const status = statusConfig[moment.status];
  const privacy = privacyConfig[moment.privacy];
  const PrivacyIcon = privacy.icon;

  // Handle video preview on hover
  const handleMouseEnter = () => {
    setIsHovering(true);
    if (enableVideoPreview && mediaType === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleClick = () => {
    navigate(`/jornada/moment/${moment.id}`);
  };

  // Compact layout for grid views
  if (compact) {
    return (
      <motion.button
        type="button"
        onClick={handleClick}
        className="group relative aspect-square overflow-hidden rounded-2xl bg-muted"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={moment.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-pink-100 to-rose-100">
            <MediaTypeIcon type={mediaType} className="h-8 w-8 text-pink-400" />
          </div>
        )}

        {/* Media type indicator */}
        {showMediaType && mediaType !== "photo" && (
          <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
            <MediaTypeIcon type={mediaType} className="h-3.5 w-3.5" />
          </div>
        )}

        {/* Status badge */}
        {status && (
          <span
            className={cn(
              "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              status.className,
            )}
          >
            {status.label}
          </span>
        )}
      </motion.button>
    );
  }

  // Full card layout
  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex w-full flex-col overflow-hidden rounded-[32px] border border-border bg-surface text-left shadow-sm transition-shadow hover:shadow-lg"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Media Section */}
      <div className="relative h-52 w-full overflow-hidden bg-muted">
        {/* Photo/Video Background */}
        {coverImage && (
          <img
            src={coverImage}
            alt={moment.title}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              isPlaying ? "opacity-0" : "opacity-100",
            )}
            loading="lazy"
          />
        )}

        {/* Video Preview (hidden until hover) */}
        {mediaType === "video" && videoUrl && enableVideoPreview && (
          <video
            ref={videoRef}
            src={videoUrl}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
              isPlaying ? "opacity-100" : "opacity-0",
            )}
            muted
            loop
            playsInline
          />
        )}

        {/* Empty state for text-only moments */}
        {!coverImage && mediaType === "text" && (
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-6">
            <FileText className="mb-2 h-8 w-8 text-pink-400" />
            {summary && (
              <p className="line-clamp-4 text-center font-serif text-lg italic text-ink">
                "{summary.slice(0, 100)}..."
              </p>
            )}
          </div>
        )}

        {/* Audio visualization placeholder */}
        {mediaType === "audio" && !coverImage && (
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
            <Mic className="mb-4 h-12 w-12 text-indigo-400" />
            <div className="flex items-center gap-1">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-indigo-400"
                  animate={{
                    height: isHovering ? [8, 24, 8] : 8,
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: isHovering ? Infinity : 0,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Video play indicator */}
        {mediaType === "video" && !isPlaying && coverImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="ml-1 h-6 w-6 text-ink" />
            </div>
          </div>
        )}

        {/* Status badge */}
        {status && (
          <span
            className={cn(
              "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold",
              status.className,
            )}
          >
            {status.label}
          </span>
        )}

        {/* Media type badge */}
        {showMediaType && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-white">
            <MediaTypeIcon type={mediaType} className="h-3.5 w-3.5" />
            <span className="text-xs font-medium capitalize">{mediaType}</span>
          </div>
        )}

        {/* Media count */}
        {moment.media && moment.media.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            +{moment.media.length - 1}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col gap-2 px-5 py-4">
        {/* Chapter & Privacy */}
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink-muted">
          {catalogInfo && <span>{catalogInfo.chapterTitle}</span>}
          <span className="h-px flex-1 bg-border" />
          <span className="flex items-center gap-1">
            <PrivacyIcon className="h-3 w-3" />
            {privacy.label}
          </span>
        </div>

        {/* Title & Date */}
        <div className="space-y-1">
          <h4 className="font-serif text-2xl text-ink">{moment.title}</h4>
          {displayDate && (
            <p className="text-sm text-ink-muted">
              {new Date(displayDate).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Type badge */}
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

        {/* Summary */}
        {summary && mediaType !== "text" && (
          <p className="line-clamp-2 text-sm text-ink-muted">{summary}</p>
        )}
      </div>
    </motion.button>
  );
};

export default EnhancedMomentCard;
