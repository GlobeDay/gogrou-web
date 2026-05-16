"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, totalPages, total }: { page: number; totalPages: number; total: number }) {
  const router = useRouter();
  const sp = useSearchParams();

  function goto(p: number) {
    const params = new URLSearchParams(sp);
    if (p <= 1) params.delete("page"); else params.set("page", String(p));
    router.push(`/gpc?${params.toString()}`);
  }

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-end text-xs text-muted-foreground pt-2">
        {total.toLocaleString("cs-CZ")} výsledků
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-xs text-muted-foreground">
        Strana {page} / {totalPages} · {total.toLocaleString("cs-CZ")} výsledků
      </span>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={() => goto(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => goto(page + 1)} disabled={page >= totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
