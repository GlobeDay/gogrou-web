import { Skeleton, SkeletonRow } from "@/components/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function LowStockLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Card><CardContent className="p-4 space-y-1">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}
      </CardContent></Card>
    </div>
  );
}
