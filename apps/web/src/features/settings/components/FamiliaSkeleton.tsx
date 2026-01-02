import { B2CSkeleton } from "@/components/skeletons/B2CSkeleton";
import { ChevronLeft } from "lucide-react";

export const FamiliaSkeleton = () => {
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
        <B2CSkeleton className="h-8 w-40" />
      </div>

      <B2CSkeleton className="h-4 w-full max-w-lg mb-6" />

      {/* Invite Section */}
      <div
        className="rounded-2xl p-4 mb-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <B2CSkeleton className="w-5 h-5 rounded" />
          <B2CSkeleton className="h-5 w-32" />
        </div>
        <div className="flex gap-2">
          <B2CSkeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>

      {/* Members List */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 flex items-center gap-4"
            style={{
              borderBottom: i < 3 ? "1px solid var(--bb-color-border)" : "none",
            }}
          >
            <B2CSkeleton className="w-12 h-12 rounded-full" />
            
            <div className="flex-1 min-w-0 space-y-2">
              <B2CSkeleton className="h-5 w-32" />
              <B2CSkeleton className="h-4 w-48" />
            </div>

            <B2CSkeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>

      {/* Info */}
      <div
        className="mt-6 p-4 rounded-2xl"
        style={{
          backgroundColor: "var(--bb-color-bg)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <B2CSkeleton className="h-4 w-full mb-2" />
        <B2CSkeleton className="h-4 w-3/4 mb-2" />
        <B2CSkeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
};
