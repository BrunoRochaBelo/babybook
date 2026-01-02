import { B2CSkeleton } from "@/components/skeletons/B2CSkeleton";
import { ChevronLeft } from "lucide-react";

export const TextPageSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-2 rounded-xl">
          <ChevronLeft 
            className="w-5 h-5" 
            style={{ color: "var(--bb-color-ink-muted)" }} 
          />
        </div>
        <B2CSkeleton className="h-8 w-48" />
      </div>

      {/* Description */}
      <B2CSkeleton className="h-4 w-full max-w-xl mb-6" />

      {/* Content Blocks */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-4"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              border: "1px solid var(--bb-color-border)",
            }}
          >
            <div className="flex items-start gap-4 mb-4">
              <B2CSkeleton className="w-9 h-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <B2CSkeleton className="h-5 w-40" />
                <B2CSkeleton className="h-4 w-full" />
              </div>
            </div>

            <div className="flex gap-2">
              <B2CSkeleton className="h-8 w-24 rounded-xl" />
              <B2CSkeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
