import { B2CSkeleton } from "@/components/skeletons/B2CSkeleton";
import { ChevronLeft } from "lucide-react";

export const SettingsSubsectionSkeleton = () => {
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

      <div className="space-y-6">
        {/* Main Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          <div className="flex items-center gap-4 mb-6">
             <B2CSkeleton className="w-12 h-12 rounded-xl" />
             <div className="space-y-2">
                <B2CSkeleton className="h-6 w-48" />
                <B2CSkeleton className="h-4 w-32" />
             </div>
          </div>
          
          <div className="space-y-3">
             <B2CSkeleton className="h-10 w-full rounded-xl" />
             <B2CSkeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

         {/* Secondary Card */}
         <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
           <B2CSkeleton className="h-6 w-32 mb-4" />
           <div className="space-y-3">
             {[1, 2, 3].map((i) => (
               <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <B2CSkeleton className="h-4 w-40" />
                    <B2CSkeleton className="h-3 w-56" />
                  </div>
                  <B2CSkeleton className="w-10 h-6 rounded-full" />
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};
