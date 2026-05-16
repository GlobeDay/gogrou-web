"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

/**
 * Sortable column header. Click cyklí: none → asc → desc → none.
 * URL state: ?sort=DC&dir=asc
 */
export function SortHeader({ field, label }: { field: string; label: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  const currentField = sp.get("sort");
  const currentDir   = sp.get("dir") as "asc" | "desc" | null;
  const active       = currentField === field;
  const dir = active ? currentDir : null;

  function toggle() {
    const params = new URLSearchParams(sp);
    if (!active) {
      params.set("sort", field); params.set("dir", "asc");
    } else if (dir === "asc") {
      params.set("dir", "desc");
    } else {
      params.delete("sort"); params.delete("dir");
    }
    params.delete("page"); // reset na stranu 1 při změně sortu
    router.push(`/gpc?${params.toString()}`);
  }

  return (
    <button onClick={toggle} className="inline-flex items-center gap-1 hover:text-foreground">
      <span>{label}</span>
      {dir === "asc"  ? <ArrowUp   className="h-3 w-3" /> :
       dir === "desc" ? <ArrowDown className="h-3 w-3" /> :
                        <ArrowUpDown className="h-3 w-3 opacity-30" />}
    </button>
  );
}
