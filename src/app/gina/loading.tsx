import { Skeleton, SkeletonCard } from "@/components/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function GinaLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-28" />)}
      </div>
      <Card><CardContent className="pt-4 space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </CardContent></Card>
    </div>
  );
}
