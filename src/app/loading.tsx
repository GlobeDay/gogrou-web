import { Skeleton, SkeletonCard } from "@/components/skeleton";

export default function RootLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-10">
      <header>
        <div className="flex items-start gap-6">
          <Skeleton className="h-14 w-14 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-9 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <div className="etched-line mt-8" aria-hidden />
      </header>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </section>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-28" />)}
      </section>
    </div>
  );
}
