import { Skeleton, SkeletonCard } from "@/components/skeleton";

export default function GpcDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-16 w-24" />
      </div>
      <div className="etched-line" aria-hidden />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-40" />)}
      </div>
    </div>
  );
}
