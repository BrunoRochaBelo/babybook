import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthCardDetailViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  layoutId?: string;
  media?: React.ReactNode;
}

export function HealthCardDetailViewer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  icon: Icon,
  layoutId,
  media,
}: HealthCardDetailViewerProps) {
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

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Content Card */}
        <motion.div
          layoutId={layoutId} // Shared Element Transition
          initial={layoutId ? undefined : { opacity: 0, scale: 0.9, y: 20 }}
          animate={layoutId ? undefined : { opacity: 1, scale: 1, y: 0 }}
          exit={layoutId ? undefined : { opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 520, damping: 46 }}
          className={cn(
            "relative w-full max-w-2xl overflow-hidden rounded-[32px] border shadow-2xl",
            "bg-[var(--bb-color-surface)] border-[var(--bb-color-border)]"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Media Slot (Prepared for Shared Element Transition) */}
          {media && (
              <div className="w-full h-48 sm:h-64 overflow-hidden bg-black/5">
                {/* 
                  Usage: The parent should pass a component wrapped in motion.div 
                  with layoutId={`${baseLayoutId}-media`} to achieve the "photo expand" effect.
                */}
                {media}
              </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--bb-color-border)] px-6 py-5 sm:px-8">
            <div className="flex items-center gap-4">
              {Icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bb-color-bg)] text-[var(--bb-color-accent)]">
                  <Icon className="h-6 w-6" />
                </div>
              )}
              <div>
                {subtitle && (
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--bb-color-ink-muted)]">
                    {subtitle}
                  </p>
                )}
                <h3 className="font-serif text-2xl font-bold text-[var(--bb-color-ink)]">
                  {title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[var(--bb-color-ink-muted)] transition-colors hover:bg-[var(--bb-color-bg)] hover:text-[var(--bb-color-ink)]"
              aria-label="Fechar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="max-h-[70vh] overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
            <div className="space-y-6 text-[var(--bb-color-ink)]">
              {children}
            </div>
          </div>

          {/* Footer - Swipe Hint for Mobile */}
          <div className="flex justify-center pb-4 pt-2 sm:hidden">
            <div className="h-1.5 w-12 rounded-full bg-[var(--bb-color-border)]" />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
