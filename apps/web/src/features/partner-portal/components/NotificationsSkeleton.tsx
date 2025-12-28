import { Skeleton } from "@/components/ui/skeleton";
import { PartnerPage } from "@/layouts/PartnerPage";
import { PartnerBackButton } from "@/layouts/PartnerBackButton";

export function NotificationsSkeleton() {
  return (
    <PartnerPage size="narrow">
      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <PartnerBackButton label="Voltar" />
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
      </div>

      {/* Mobile summary */}
      <div className="md:hidden mb-4">
        <Skeleton className="h-4 w-32 rounded" />
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4">
              {/* Icon */}
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <Skeleton className="h-3 w-full rounded mb-1" />
                <Skeleton className="h-3 w-5/6 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <Skeleton className="h-4 w-full rounded" />
      </div>
    </PartnerPage>
  );
}
