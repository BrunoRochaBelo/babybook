import { Skeleton } from "@/components/ui/skeleton";

export function ReviewSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
         
         <div className="flex flex-col items-center justify-center gap-4 py-6">
             <Skeleton className="w-20 h-20 rounded-full" />
             <Skeleton className="h-8 w-64 rounded" />
             <Skeleton className="h-4 w-80 rounded" />
         </div>

         {/* Summary Card Skeleton */}
         <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-6 text-left border border-gray-100 dark:border-gray-700">
             <Skeleton className="h-4 w-20 mb-6" />
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                 <div>
                     <Skeleton className="h-3 w-16 mb-2" />
                     <Skeleton className="h-6 w-40 rounded" />
                 </div>
                 <div>
                     <Skeleton className="h-3 w-16 mb-2" />
                     <Skeleton className="h-6 w-24 rounded-full" />
                 </div>
                 <div>
                     <Skeleton className="h-3 w-16 mb-2" />
                     <Skeleton className="h-5 w-32 rounded" />
                 </div>
             </div>
         </div>

         {/* Actions Skeleton */}
         <div className="grid sm:grid-cols-2 gap-4">
             <Skeleton className="h-14 w-full rounded-xl" />
             <Skeleton className="h-14 w-full rounded-xl" />
         </div>
    </div>
  );
}
