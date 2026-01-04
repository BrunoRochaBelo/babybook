import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface B2CEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  illustration?: ReactNode; // Optional custom illustration
}

export function B2CEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  illustration,
}: B2CEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-[32px] border border-dashed border-[var(--bb-color-border-strong)] bg-[var(--bb-color-surface)]/50",
        className
      )}
    >
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : Icon ? (
        <div className="mb-6 p-4 rounded-full bg-[var(--bb-color-bg)] text-[var(--bb-color-accent)]">
          <Icon className="w-8 h-8 opacity-80" />
        </div>
      ) : null}

      <h3 className="text-xl font-serif font-semibold text-[var(--bb-color-ink)] mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-[var(--bb-color-ink-muted)] mb-8 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </motion.div>
  );
}
