import { Skeleton, SkeletonRow } from "@/components/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AuditLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Card><CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9" />)}
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-4 space-y-1">
        {Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
      </CardContent></Card>
    </div>
  );
}
