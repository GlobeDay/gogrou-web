import { Skeleton, SkeletonCard } from "@/components/skeleton";

export default function ItemDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="etched-line" aria-hidden />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-20" />)}
      </div>
      <SkeletonCard className="h-64" />
    </div>
  );
}
