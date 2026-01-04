import { B2CSkeleton } from "./B2CSkeleton";

export function GuestbookSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Title + Subtitle */}
      <div className="space-y-4 mb-8">
        <B2CSkeleton className="h-12 w-64 rounded-xl" />
        <B2CSkeleton className="h-6 w-96 rounded-lg opacity-60" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <B2CSkeleton className="h-10 flex-1 rounded-2xl" />
        <B2CSkeleton className="h-10 flex-1 rounded-2xl" />
      </div>

      {/* HUD Card */}
      <div 
        className="rounded-3xl p-6"
        style={{ backgroundColor: "var(--bb-color-surface)", borderColor: "var(--bb-color-border)", borderWidth: 1 }}
      >
        <B2CSkeleton className="h-4 w-32 rounded-md mb-2" />
        <B2CSkeleton className="h-6 w-48 rounded-lg mb-3" />
        <B2CSkeleton className="h-3 w-full rounded-md mb-4" />
        <B2CSkeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Guest Entries */}
      <div className="space-y-3">
        {/* Entry 1 */}
        <div 
          className="rounded-2xl p-4"
          style={{ backgroundColor: "var(--bb-color-surface)", borderColor: "var(--bb-color-border)", borderWidth: 1 }}
        >
          <div className="flex gap-4">
            <B2CSkeleton className="h-12 w-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <B2CSkeleton className="h-4 w-32 rounded-md" />
              <B2CSkeleton className="h-3 w-full rounded-md" />
              <B2CSkeleton className="h-3 w-3/4 rounded-md" />
            </div>
          </div>
        </div>

        {/* Entry 2 */}
        <div 
          className="rounded-2xl p-4"
          style={{ backgroundColor: "var(--bb-color-surface)", borderColor: "var(--bb-color-border)", borderWidth: 1 }}
        >
          <div className="flex gap-4">
            <B2CSkeleton className="h-12 w-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <B2CSkeleton className="h-4 w-24 rounded-md" />
              <B2CSkeleton className="h-3 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
