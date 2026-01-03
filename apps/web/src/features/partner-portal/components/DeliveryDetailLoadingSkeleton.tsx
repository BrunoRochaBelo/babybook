
import { Skeleton } from "@/components/ui/skeleton";
import { PartnerPage } from "@/layouts/PartnerPage";

export function DeliveryDetailLoadingSkeleton() {
  return (
    <PartnerPage>
      {/* Back Navigation Skeleton */}
      <div className="hidden md:flex items-center gap-2 mb-4">
        <Skeleton className="w-24 h-6 rounded-md" />
      </div>

      {/* Mobile Meta Skeleton */}
      <div className="md:hidden mb-4 space-y-1">
        <Skeleton className="w-3/4 h-5 rounded" />
        <Skeleton className="w-1/2 h-4 rounded" />
      </div>

      {/* Desktop Page Header Skeleton */}
      <div className="hidden md:block mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
      </div>

      {/* Voucher Section Skeleton */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-[1.5rem] border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
          <div className="flex gap-2">
             <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Additional Info Skeleton */}
      <div className="mb-6 flex gap-4">
        <Skeleton className="h-5 w-40 rounded" />
        <Skeleton className="h-5 w-64 rounded" />
      </div>

      {/* Assets Grid Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-[1.5rem] border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PartnerPage>
  );
}
