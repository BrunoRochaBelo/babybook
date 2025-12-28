import { PartnerPage } from "@/layouts/PartnerPage";
import { Skeleton } from "@/layouts/Skeleton";

export function DashboardSkeleton() {
  return (
    <PartnerPage>
      <div className="animate-pulse space-y-4">
        <div className="hidden md:block">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>

        <div className="rounded-2xl p-6 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 h-40" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
            >
              <Skeleton className="h-10 w-10 rounded-lg mb-3" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-4 w-24 mt-2" />
              <Skeleton className="h-3 w-28 mt-2" />
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-64 mt-2" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PartnerPage>
  );
}
