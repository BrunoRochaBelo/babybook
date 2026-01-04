import { B2CSkeleton } from "./B2CSkeleton";

export function VaultSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Title + Subtitle */}
      <div className="space-y-4 mb-8">
        <B2CSkeleton className="h-12 w-64 rounded-xl" />
        <B2CSkeleton className="h-6 w-96 rounded-lg opacity-60" />
      </div>
      
      {/* HUD Card */}
      <div 
        className="rounded-3xl p-6"
        style={{ backgroundColor: "var(--bb-color-surface)", borderColor: "var(--bb-color-border)", borderWidth: 1 }}
      >
        <B2CSkeleton className="h-4 w-32 rounded-md mb-2" />
        <B2CSkeleton className="h-6 w-64 rounded-lg mb-3" />
        <B2CSkeleton className="h-3 w-full rounded-md mb-4" />
        <B2CSkeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Info Banner */}
      <B2CSkeleton className="h-16 w-full rounded-[32px]" />

      {/* Documents Section */}
       <div 
        className="rounded-2xl p-6"
        style={{ backgroundColor: "var(--bb-color-surface)", borderColor: "var(--bb-color-border)", borderWidth: 1 }}
      >
        <B2CSkeleton className="h-5 w-48 rounded-lg mx-auto mb-6" />
        
        {/* Document Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
           <B2CSkeleton className="aspect-[1.586] w-full rounded-xl" />
           <B2CSkeleton className="aspect-[1.586] w-full rounded-xl" />
           <B2CSkeleton className="aspect-[1.586] w-full rounded-xl" />
           <B2CSkeleton className="aspect-[1.586] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
