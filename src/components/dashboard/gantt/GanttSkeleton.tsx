import { Skeleton } from "@/components/ui/skeleton";

export function GanttSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[600px] w-full rounded-lg" />
    </div>
  );
}
