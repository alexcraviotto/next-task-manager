import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      {/* Title Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-[250px]" />
      </div>

      {/* Info Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 mt-10 gap-4 md:gap-16">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[100px] flex flex-col items-center justify-center space-y-2"
          >
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="mt-20 space-y-4">
        <Skeleton className="h-8 w-48" /> {/* Chart title */}
        <Skeleton className="h-[300px] w-full rounded-xl" /> {/* Chart area */}
      </div>
    </div>
  );
}
