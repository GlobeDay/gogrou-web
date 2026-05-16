/**
 * Tiny Skeleton primitive — slabě pulzující placeholder.
 * Pro Suspense fallbacks, loading.tsx, mutace.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
      aria-hidden
      {...props}
    />
  );
}

/** Skeleton row — pro tabulky. */
export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex gap-3 py-2 border-b last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === 0 ? "w-1/4" : "flex-1"}`} />
      ))}
    </div>
  );
}

/** Skeleton card — pro grid layouty. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`rounded-lg border p-4 space-y-2 ${className ?? ""}`}>
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}
