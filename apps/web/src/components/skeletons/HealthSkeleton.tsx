import { B2CSkeleton } from "./B2CSkeleton";

export function HealthSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
      {/* Icon + Title */}
      <div className="text-center space-y-2">
        <B2CSkeleton className="h-10 w-10 rounded-full mx-auto" />
        <B2CSkeleton className="h-8 w-32 rounded-xl mx-auto" />
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2">
        <B2CSkeleton className="h-12 flex-1 rounded-2xl" />
        <B2CSkeleton className="h-12 flex-1 rounded-2xl" />
        <B2CSkeleton className="h-12 flex-1 rounded-2xl" />
      </div>

      {/* HUD Card */}
      <div 
        className="rounded-3xl p-6"
        style={{ backgroundColor: "var(--bb-color-surface)", borderColor: "var(--bb-color-border)", borderWidth: 1 }}
      >
        <B2CSkeleton className="h-4 w-40 rounded-md mb-2" />
        <B2CSkeleton className="h-6 w-56 rounded-lg mb-3" />
        <B2CSkeleton className="h-3 w-full rounded-md mb-4" />
        <B2CSkeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Content Area - Chart or List */}
      <div 
        className="rounded-[32px] p-6 space-y-4"
        style={{ backgroundColor: "var(--bb-color-surface)", borderColor: "var(--bb-color-border)", borderWidth: 1 }}
      >
        <B2CSkeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <B2CSkeleton className="h-24 w-full rounded-2xl" />
          <B2CSkeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
