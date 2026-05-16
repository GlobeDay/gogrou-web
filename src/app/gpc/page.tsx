import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { SearchForm } from "@/components/gpc/search-form";
import { Pagination } from "@/components/gpc/pagination";
import { SortHeader } from "@/components/gpc/sort-header";
import { supabase, TOOL_TYPE_LABELS, type ToolType } from "@/lib/supabase";
import { fmtValue } from "@/lib/format";
import { getClassSchema, selectQuickFilters } from "@/lib/class-schema";
import { can } from "@/lib/tenant";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Boxes } from "lucide-react";

type SP = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 50;

const SORTABLE_KEYS: Record<string, string[]> = {
  "tool.endmill":          ["name", "DC", "RE", "NOF"],
  "tool.drill":            ["name", "DC", "OAL", "NOF"],
  "tool.insert":           ["name", "_iso_base", "RE", "L"],
  "tool.tap":              ["name", "TD", "TP"],
  "tool.holder":           ["name", "DCONMS", "OAL", "WT"],
  "tool.reamer":           ["name", "DC", "OAL", "NOF"],
  "tool.thread_mill":      ["name", "DCX", "TP", "OAL"],
  "tool.thread_die":       ["name", "TD", "TP"],
  "tool.grooving_insert":  ["name", "IC", "L", "CRE"],
  "tool.threading_insert": ["name", "PFS"],
};

function parseFilters(sp: Record<string, string | string[] | undefined>) {
  const filters: Record<string, Record<string, unknown>> = {};
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v !== "string" || !k.startsWith("f.")) continue;
    const tail = k.slice(2);
    raw[tail] = v;
    const [path, op = "eq"] = tail.split(/\.(?=(gte|lte|gt|lt|eq|neq|like|in)$)/);
    filters[path] ??= {};
    const n = Number(v);
    filters[path][op] = Number.isFinite(n) && /^[+-]?\d+(\.\d+)?$/.test(v) ? n : v;
  }
  return { filters, raw };
}

async function runSearch(args: {
  type: ToolType; text?: string;
  filters: Record<string, Record<string, unknown>>;
  sort: Array<{ field: string; dir: "asc" | "desc" }>;
  page: number;
}) {
  const { data, error } = await supabase.rpc("gpc_search", {
    p_type:    args.type,
    p_status:  "active",
    p_text:    args.text,
    p_filters: args.filters as never,
    p_sort:    args.sort as never,
    p_limit:   PAGE_SIZE,
    p_offset:  (args.page - 1) * PAGE_SIZE,
  });
  if (error) throw error;
  return data ?? [];
}

export default async function GpcSearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const type = (typeof sp.type === "string" ? sp.type : "tool.endmill") as ToolType;
  const q    = typeof sp.q === "string" ? sp.q : undefined;
  const page = Math.max(1, Number(sp.page ?? 1));
  const sortField = typeof sp.sort === "string" ? sp.sort : null;
  const sortDir: "asc" | "desc" = sp.dir === "desc" ? "desc" : "asc";
  const sort: Array<{ field: string; dir: "asc" | "desc" }> =
    sortField ? [{ field: sortField, dir: sortDir }] : [];
  const { filters, raw } = parseFilters(sp);

  // Načti schema + výsledky paralelně
  const [rowsP, schemaP] = await Promise.allSettled([
    runSearch({ type, text: q, filters, sort, page }),
    getClassSchema(type),
  ]);
  const rows = rowsP.status === "fulfilled" ? rowsP.value : [];
  const errMsg = rowsP.status === "rejected" ? (rowsP.reason instanceof Error ? rowsP.reason.message : String(rowsP.reason)) : null;
  const schema = schemaP.status === "fulfilled" ? schemaP.value : [];
  const quickFilters = selectQuickFilters(schema, 8);

  const total = Number(rows[0]?.total_count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sortable = SORTABLE_KEYS[type] ?? ["name"];
  const canCreate = await can("gpc.edit");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight">GPC Search</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="outline" className="font-mono">{type}</Badge> {TOOL_TYPE_LABELS[type]?.cs}
          {canCreate && (
            <Link href={`/gpc/new?type=${type}`}>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nový</Button>
            </Link>
          )}
        </div>
      </div>

      <SearchForm initialType={type} initialText={q ?? ""} initialFilters={raw} quickFilters={quickFilters} />

      {errMsg && (
        <Card><CardContent className="text-sm text-destructive py-3">Chyba: {errMsg}</CardContent></Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[260px]">GID</TableHead>
                <TableHead>
                  {sortable.includes("name") ? <SortHeader field="name" label="Name" /> : "Name"}
                </TableHead>
                <TableHead>Key params</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="hover:bg-accent/40">
                  <TableCell className="font-mono text-xs">
                    <Link href={`/gpc/${r.id}`} className="hover:underline">{r.gid}</Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/gpc/${r.id}`} className="hover:underline">{r.name}</Link>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <KeyParamsCell type={type} params={r.params as Record<string, unknown>} sortable={sortable} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !errMsg && (
                <TableRow>
                  <TableCell colSpan={4} className="py-12">
                    <EmptyState
                      icon={Boxes}
                      title="Žádné výsledky"
                      description="Zkus jiný filtr nebo type."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}

function KeyParamsCell({ type, params, sortable }: { type: ToolType; params: Record<string, unknown>; sortable: string[] }) {
  const KEYS: Record<string, string[]> = {
    "tool.endmill":          ["DC", "RE", "NOF", "COATN", "_product_family"],
    "tool.drill":            ["DC", "OAL", "NOF", "BMC", "COATN"],
    "tool.insert":           ["_iso_base", "RE", "L", "CBMD", "COATN"],
    "tool.tap":              ["THREAD_SIZE", "TD", "TP", "TCTR", "BMC"],
    "tool.holder":           ["connection_code", "holder_type", "DCONMS", "OAL"],
    "tool.thread_mill":      ["THREAD_SIZE", "DCX", "TP", "COATN"],
    "tool.thread_die":       ["THREAD_SIZE", "TD", "TP", "HAND"],
    "tool.reamer":           ["DC", "OAL", "LU", "NOF"],
    "tool.grooving_insert":  ["IC", "L", "CRE", "PFS"],
    "tool.threading_insert": ["PFS", "THFT", "TPT"],
  };
  const keys = KEYS[type] ?? [];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {keys.map((k) => {
        const v = params[k];
        if (v === undefined || v === null || v === "") return null;
        const isSortable = sortable.includes(k);
        return (
          <span key={k}>
            <span className={`font-mono ${isSortable ? "opacity-90 font-medium" : "opacity-70"}`}>
              {k.replace(/^_/, "")}:
            </span>{" "}
            {fmtValue(v)}
          </span>
        );
      })}
    </div>
  );
}
