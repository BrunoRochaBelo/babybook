import { B2CSkeleton } from "./B2CSkeleton";

export function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Header - "Jornada" title */}
      <div className="flex justify-center mb-6">
        <B2CSkeleton className="h-10 w-32 rounded-xl" />
      </div>
      
      {/* Timeline Moments */}
      <div className="space-y-4">
        {/* Moment Card 1 */}
        <div 
          className="rounded-3xl p-4 space-y-3"
          style={{ backgroundColor: "var(--bb-color-surface)", borderColor: "var(--bb-color-border)", borderWidth: 1 }}
        >
          <div className="flex items-start gap-4">
            <B2CSkeleton className="h-12 w-12 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <B2CSkeleton className="h-5 w-3/4 rounded-lg" />
              <B2CSkeleton className="h-3 w-1/2 rounded-md" />
              <B2CSkeleton className="aspect-[4/3] w-full rounded-2xl" />
            </div>
          </div>
        </div>

        {/* Moment Card 2 */}
        <div 
          className="rounded-3xl p-4 space-y-3"
          style={{ backgroundColor: "var(--bb-color-surface)", borderColor: "var(--bb-color-border)", borderWidth: 1 }}
        >
          <div className="flex items-start gap-4">
            <B2CSkeleton className="h-12 w-12 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <B2CSkeleton className="h-5 w-2/3 rounded-lg" />
              <B2CSkeleton className="h-3 w-1/3 rounded-md" />
            </div>
          </div>
        </div>

        {/* Moment Card 3 */}
        <div 
          className="rounded-3xl p-4 space-y-3"
          style={{ backgroundColor: "var(--bb-color-surface)", borderColor: "var(--bb-color-border)", borderWidth: 1 }}
        >
          <div className="flex items-start gap-4">
            <B2CSkeleton className="h-12 w-12 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <B2CSkeleton className="h-5 w-1/2 rounded-lg" />
              <B2CSkeleton className="h-3 w-2/5 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
