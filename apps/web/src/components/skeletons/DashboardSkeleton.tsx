import { B2CSkeleton } from "./B2CSkeleton";

export function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header - "Jornada" title */}
      <div className="flex justify-center mb-6">
        <B2CSkeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Child Selector */}
      <div className="flex justify-center mb-6">
        <B2CSkeleton className="h-11 w-full max-w-sm rounded-2xl" />
      </div>

      {/* HUD (Head-Up Display) */}
      <div 
        className="rounded-2xl shadow-sm p-6 mb-6 border"
        style={{ backgroundColor: "var(--bb-color-surface)", borderColor: "var(--bb-color-border)" }}
      >
        <B2CSkeleton className="h-8 w-48 mb-2 rounded-lg" />
        <B2CSkeleton className="h-4 w-32 mb-4 rounded-md opacity-60" />
        
        {/* Suggestion Card inside HUD */}
        <B2CSkeleton className="h-40 w-full rounded-2xl mb-4" />
        
        <B2CSkeleton className="h-3 w-64 rounded-md opacity-60" />
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div 
          className="w-full rounded-2xl border p-1.5 shadow-sm"
          style={{ backgroundColor: "var(--bb-color-surface)", borderColor: "var(--bb-color-border)" }}
        >
          <div className="flex gap-1.5">
             <B2CSkeleton className="h-9 flex-1 rounded-xl" />
             <B2CSkeleton className="h-9 flex-1 rounded-xl opacity-40" />
          </div>
        </div>
      </div>
      
      {/* Section Title */}
      <B2CSkeleton className="h-7 w-40 mb-4 rounded-lg" />

      {/* Timeline Moments */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div 
            key={i}
            className="rounded-3xl p-4 md:p-5 border space-y-3"
            style={{ backgroundColor: "var(--bb-color-surface)", borderColor: "var(--bb-color-border)" }}
          >
            <div className="flex items-start gap-4">
              <B2CSkeleton className="h-10 w-10 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <B2CSkeleton className="h-6 w-3/4 rounded-lg" />
                <B2CSkeleton className="h-4 w-1/3 rounded-md opacity-60" />
                <div className="pt-2">
                   <B2CSkeleton className="aspect-video w-full rounded-2xl" />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t" style={{ borderColor: "var(--bb-color-border)" }}>
               <B2CSkeleton className="h-8 w-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
