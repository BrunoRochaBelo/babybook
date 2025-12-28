import { PartnerPage } from "@/layouts/PartnerPage";
import { Skeleton } from "@/layouts/Skeleton";

export function CreditsSkeleton() {
  return (
    <PartnerPage>
      {/* Header Skeleton */}
      <div className="hidden md:block mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="md:hidden mb-4">
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Balance Card Skeleton */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 mb-8 h-48 animate-pulse" />

      {/* Packages Grid Skeleton */}
      <div className="space-y-4 mb-8">
        <Skeleton className="h-7 w-48 mb-4" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-32" />
                    {i === 1 && <Skeleton className="h-5 w-24 rounded-full" />}
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-40" />
                    <div className="flex items-baseline gap-2">
                      <Skeleton className="h-7 w-28" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
                <Skeleton className="w-6 h-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PartnerPage>
  );
}
