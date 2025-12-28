import { Skeleton } from "@/components/ui/skeleton";

export function PartnerLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-b border-gray-200/60 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo Placeholder */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-md" />
              <Skeleton className="h-6 w-32 rounded-md" />
            </div>

            {/* Right Side Actions Placeholder */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-16 h-8 rounded-lg" />
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1.5 pr-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-24 hidden sm:block rounded" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="flex-1 pb-24 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header placeholder */}
        <div className="mb-8">
           <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
           <Skeleton className="h-4 w-64 rounded" />
        </div>
        
        {/* Content placeholder cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
        </div>

        <Skeleton className="h-64 rounded-2xl w-full" />
      </main>

      {/* Bottom Nav Skeleton (Mobile/Tablet) */}
      <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center rounded-full border border-gray-200/60 dark:border-gray-600/40 bg-white/95 dark:bg-gray-800/95 px-2 py-2 shadow-lg backdrop-blur-lg">
        <div className="flex-1 flex justify-center">
             <Skeleton className="w-6 h-6 rounded-full" />
        </div>
        <div className="flex-1 flex justify-center">
             <Skeleton className="w-6 h-6 rounded-full" />
        </div>
        <div className="flex-1 flex justify-center">
             <Skeleton className="w-6 h-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}
