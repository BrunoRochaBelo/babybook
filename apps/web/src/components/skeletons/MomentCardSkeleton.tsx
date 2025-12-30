import { Skeleton } from "@/components/ui/skeleton";

export function MomentCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
      <div className="flex items-start gap-4">
        {/* Date/Icon Skeleton */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="h-full w-0.5 bg-gray-100 dark:bg-gray-700" />
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <Skeleton className="h-5 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md opacity-60" />
          </div>
          
          {/* Photo Placeholder */}
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
