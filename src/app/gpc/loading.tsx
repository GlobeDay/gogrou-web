import { Skeleton, SkeletonRow } from "@/components/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function GpcLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-32" />
      </div>
      <Card><CardContent className="space-y-3 pt-4">
        <Skeleton className="h-9 w-full" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9" />)}
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-4 space-y-1">
        {Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}
      </CardContent></Card>
    </div>
  );
}
