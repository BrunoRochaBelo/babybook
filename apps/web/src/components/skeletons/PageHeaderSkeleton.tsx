import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-4 w-64 rounded-md opacity-60" />
    </div>
  );
}
