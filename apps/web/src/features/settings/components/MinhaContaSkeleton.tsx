import { B2CSkeleton } from "@/components/skeletons/B2CSkeleton";
import { ChevronLeft } from "lucide-react";

export const MinhaContaSkeleton = () => {
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

      {/* Avatar Section */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <B2CSkeleton className="w-24 h-24 rounded-2xl" />
          <div className="flex flex-col items-center gap-2">
            <B2CSkeleton className="h-6 w-40" />
            <B2CSkeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Dados Pessoais */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <B2CSkeleton className="h-5 w-32" />
          <B2CSkeleton className="h-8 w-16 rounded-lg" />
        </div>

        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{ backgroundColor: "var(--bb-color-bg)" }}
            >
              <B2CSkeleton className="w-9 h-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <B2CSkeleton className="h-3 w-20" />
                <B2CSkeleton className="h-5 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segurança */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <B2CSkeleton className="h-5 w-24 mb-4" />
        
        <div
          className="flex items-center gap-4 p-4 rounded-xl mb-4"
          style={{ backgroundColor: "var(--bb-color-bg)" }}
        >
          <B2CSkeleton className="w-9 h-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <B2CSkeleton className="h-5 w-40" />
            <B2CSkeleton className="h-4 w-60" />
          </div>
        </div>

        <B2CSkeleton className="h-24 w-full rounded-xl" />
      </div>

      {/* Preferências */}
      <div
        className="rounded-2xl p-6 mt-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <B2CSkeleton className="h-5 w-32 mb-4" />

        <B2CSkeleton className="h-5 w-16 mb-3" />
        <B2CSkeleton className="h-10 w-full rounded-2xl mb-6" />

        <B2CSkeleton className="h-5 w-16 mb-3" />
        <B2CSkeleton className="h-10 w-full rounded-2xl" />
      </div>

      {/* Logout */}
      <B2CSkeleton className="mt-6 w-full h-14 rounded-2xl" />
    </div>
  );
};
