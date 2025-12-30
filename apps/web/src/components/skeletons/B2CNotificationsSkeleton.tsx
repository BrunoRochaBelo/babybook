/**
 * B2C Notifications Skeleton
 *
 * Skeleton loading para a página de notificações B2C.
 * Segue padrão B2B do Partner Portal.
 */

import { B2CSkeleton } from "@/components/skeletons/B2CSkeleton";

export function B2CNotificationsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <B2CSkeleton className="w-9 h-9 rounded-xl" />
        <div className="flex-1">
          <B2CSkeleton className="h-7 w-40 rounded-lg mb-2" />
          <B2CSkeleton className="h-4 w-24 rounded" />
        </div>
        <B2CSkeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Notifications List */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-start gap-4 p-4"
            style={{
              borderBottom:
                idx < 4 ? "1px solid var(--bb-color-border)" : "none",
            }}
          >
            {/* Icon */}
            <B2CSkeleton className="w-10 h-10 rounded-full flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <B2CSkeleton className="h-4 w-3/4 rounded" />
                <B2CSkeleton className="h-3 w-16 rounded" />
              </div>
              <B2CSkeleton className="h-3 w-full rounded mb-1" />
              <B2CSkeleton className="h-3 w-5/6 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div
        className="mt-6 p-4 rounded-2xl"
        style={{
          backgroundColor: "var(--bb-color-bg)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <B2CSkeleton className="h-4 w-full rounded" />
      </div>
    </div>
  );
}
