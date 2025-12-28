import { PartnerPage } from "@/layouts/PartnerPage";
import { Skeleton } from "@/layouts/Skeleton";

export function SettingsSkeleton() {
  return (
    <PartnerPage>
      {/* Header Skeleton */}
      <div className="hidden md:block mb-8">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-32" />
      </div>

      <div className="md:hidden mb-4">
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Logo Section Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="flex items-center gap-6">
          <Skeleton className="w-24 h-24 rounded-xl" />
          <div>
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>

      {/* Profile Fields Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      {/* Preferences Section Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </PartnerPage>
  );
}
