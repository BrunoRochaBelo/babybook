import { Skeleton } from "@/components/ui/skeleton";

export function CreditsExtractSkeleton() {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-700">
        {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Icon Skeleton */}
                    <Skeleton className="w-12 h-12 rounded-full" />
                    
                    {/* Text Skeleton */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32 md:w-48 rounded" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-3 h-3 rounded-full" />
                            <Skeleton className="h-3 w-24 rounded" />
                        </div>
                    </div>
                </div>
            
                {/* Amount Skeleton */}
                <div className="text-right space-y-2">
                    <Skeleton className="h-5 w-16 ml-auto rounded" />
                    <Skeleton className="h-3 w-20 ml-auto rounded" />
                </div>
            </div>
        ))}
    </div>
  );
}
