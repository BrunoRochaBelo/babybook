import { PartnerPage } from "@/layouts/PartnerPage";
import { Skeleton } from "@/layouts/Skeleton";

export function CreditsSkeleton() {
  return (
    <PartnerPage>
      <div className="pb-60 lg:pb-12">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-6 w-96 max-w-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Wallet Card Skeleton */}
            <div className="relative overflow-hidden rounded-2xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                  <Skeleton className="h-5 w-32" />
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <div className="hidden md:block h-24 w-px bg-gray-200 dark:bg-gray-800" />
                <div className="md:pl-6 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>

            {/* Packages Grid Skeleton */}
            <div className="space-y-4">
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
                          {i === 1 && (
                            <Skeleton className="h-5 w-24 rounded-full" />
                          )}
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

            {/* Info Section Skeleton */}
            <div className="p-6 rounded-xl border border-gray-100 dark:border-gray-800 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary Skeleton */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
              <Skeleton className="h-6 w-32" />
              
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1 rounded-lg" />
                <Skeleton className="h-10 flex-1 rounded-lg" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-px w-full my-2" />
                <div className="flex justify-between items-end">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>

              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </PartnerPage>
  );
}
