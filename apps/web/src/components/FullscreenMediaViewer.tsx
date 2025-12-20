/**
 * FullscreenMediaViewer - Immersive Media Viewing Experience
 *
 * Features:
 * - Full-screen modal overlay
 * - Swipe gestures for navigation (left/right)
 * - Pinch-to-zoom for photos
 * - Video player controls
 * - Audio player with visualization
 * - Close with swipe down or tap on overlay
 */

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Download,
} from "lucide-react";
import type { MomentMedia } from "@babybook/contracts";
import { getMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

interface FullscreenMediaViewerProps {
  media: MomentMedia[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function FullscreenMediaViewer({
  media,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
}: FullscreenMediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-200, 0, 200], [0.3, 1, 0.3]);

  const currentMedia = media[currentIndex];
  const hasMultiple = media.length > 1;

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      setScale(1);
      x.set(0);
      y.set(0);
    }
  }, [isOpen, initialIndex, x, y]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const goToNext = useCallback(() => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsZoomed(false);
      setScale(1);
    }
  }, [currentIndex, media.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsZoomed(false);
      setScale(1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToNext, goToPrevious, onClose]);

  const toggleZoom = () => {
    setIsZoomed((prev) => !prev);
    setScale((prev) => (prev === 1 ? 2 : 1));
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 100;
    const velocityThreshold = 500;

    // Swipe down to close
    if (info.offset.y > threshold || info.velocity.y > velocityThreshold) {
      onClose();
      return;
    }

    // Swipe left/right for navigation
    if (!isZoomed) {
      if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
        goToNext();
      } else if (
        info.offset.x > threshold ||
        info.velocity.x > velocityThreshold
      ) {
        goToPrevious();
      }
    }

    // Reset position
    x.set(0);
    y.set(0);
  };

  const handleDownload = async () => {
    const url = getMediaUrl(currentMedia, "full") ?? getMediaUrl(currentMedia);
    if (!url) return;

    try {
      const response = await fetch(url, { referrerPolicy: "no-referrer" });
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `babybook-${currentIndex + 1}.${currentMedia.kind === "photo" ? "jpg" : currentMedia.kind === "video" ? "mp4" : "mp3"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (!isOpen) return null;

  const mediaUrl =
    getMediaUrl(currentMedia, "full") ?? getMediaUrl(currentMedia);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
        onClick={onClose}
      >
        {/* Header */}
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {title && (
              <span className="text-white font-medium truncate max-w-[200px]">
                {title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasMultiple && (
              <span className="text-white/80 text-sm">
                {currentIndex + 1} / {media.length}
              </span>
            )}

            {currentMedia.kind === "photo" && (
              <button
                onClick={toggleZoom}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={isZoomed ? "Diminuir zoom" : "Aumentar zoom"}
              >
                {isZoomed ? (
                  <ZoomOut className="w-5 h-5 text-white" />
                ) : (
                  <ZoomIn className="w-5 h-5 text-white" />
                )}
              </button>
            )}

            {(currentMedia.kind === "video" ||
              currentMedia.kind === "audio") && (
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={isMuted ? "Ativar som" : "Silenciar"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
            )}

            <button
              onClick={handleDownload}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Baixar"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>

        {/* Main Content - Swipeable */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ x, y, opacity }}
          drag={!isZoomed}
          dragElastic={0.2}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          onDragEnd={handleDragEnd}
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-full max-h-full"
            >
              {/* Photo */}
              {currentMedia.kind === "photo" && mediaUrl && (
                <motion.img
                  src={mediaUrl}
                  alt=""
                  className="max-w-full max-h-[80vh] object-contain select-none"
                  style={{ scale }}
                  onDoubleClick={toggleZoom}
                  draggable={false}
                />
              )}

              {/* Video */}
              {currentMedia.kind === "video" && mediaUrl && (
                <div className="relative">
                  <video
                    src={mediaUrl}
                    className="max-w-full max-h-[80vh] object-contain"
                    controls
                    autoPlay
                    muted={isMuted}
                  />
                </div>
              )}

              {/* Audio */}
              {currentMedia.kind === "audio" && mediaUrl && (
                <div className="w-[90vw] max-w-md bg-white/10 rounded-2xl p-8 text-center">
                  <div className="mb-6">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
                      <Volume2 className="w-12 h-12 text-white" />
                    </div>
                  </div>

                  <audio src={mediaUrl} controls className="w-full" autoPlay />

                  <p className="mt-4 text-white/60 text-sm">
                    Gravação de áudio
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Navigation Arrows */}
        {hasMultiple && !isZoomed && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              disabled={currentIndex === 0}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors",
                currentIndex === 0 && "opacity-30 cursor-not-allowed",
              )}
              aria-label="Anterior"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              disabled={currentIndex === media.length - 1}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors",
                currentIndex === media.length - 1 &&
                  "opacity-30 cursor-not-allowed",
              )}
              aria-label="Próximo"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* Dots indicator */}
        {hasMultiple && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                  setIsZoomed(false);
                  setScale(1);
                }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex
                    ? "bg-white w-4"
                    : "bg-white/40 hover:bg-white/60",
                )}
                aria-label={`Ir para mídia ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Swipe hint */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/60 text-sm"
        >
          Deslize para baixo para fechar
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

export default FullscreenMediaViewer;
