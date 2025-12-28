import { PartnerPage } from "@/layouts/PartnerPage";
import { Skeleton } from "@/layouts/Skeleton";

export function UploadSkeleton() {
  return (
    <PartnerPage size="narrow">
      {/* Back Navigation Skeleton */}
      <div className="hidden md:flex items-center gap-2 mb-4">
        <Skeleton className="w-24 h-6 rounded-md" />
      </div>

      <div className="md:hidden mb-4 space-y-1">
        <Skeleton className="w-32 h-4" />
      </div>

      {/* Header Skeleton */}
      <div className="hidden md:block mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Stats Card Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-7 w-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
        <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </PartnerPage>
  );
}
