
import { Skeleton } from "@/components/ui/skeleton";

export function DeliveriesLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Mobile/Tablet: Cards Skeleton */}
      <div className="grid gap-3 lg:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="w-11 h-11 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between gap-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
            </div>
            <div className="flex justify-between gap-3 pt-1">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-5 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table Skeleton */}
      <div className="hidden lg:block">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/30">
                <tr>
                  {[
                    "Entrega",
                    "Cliente",
                    "Status",
                    "Criada em",
                    "Voucher / Crédito",
                    "Ações",
                  ].map((header, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-left font-medium text-gray-400 dark:text-gray-500 ${
                        i === 5 ? "text-right" : ""
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32 rounded" />
                          {i % 2 === 0 && (
                            <Skeleton className="h-3 w-20 rounded" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-16 rounded" />
                        <Skeleton className="h-3 w-12 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-24 rounded" />
                        {i % 3 === 0 && (
                          <Skeleton className="h-5 w-16 rounded-full" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="w-8 h-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
