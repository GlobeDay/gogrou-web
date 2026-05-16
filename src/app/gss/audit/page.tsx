import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { getActiveTenant } from "@/lib/tenant";
import { fmtDate } from "@/lib/format";
import { AuditFilters } from "./audit-filters";
import { Pagination } from "@/components/gpc/pagination";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";

type SP = Promise<{
  dm?: string; mv?: string; user?: string;
  from?: string; to?: string; page?: string;
}>;

const PAGE_SIZE = 50;
const MOVEMENT_TYPES = ["receive","issue","transfer","service_out","service_in","scrap","adjust"];

export default async function AuditPage({ searchParams }: { searchParams: SP }) {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/audit");

  const [sb, tenant, sp] = await Promise.all([getServerSupabase(), getActiveTenant(), searchParams]);
  if (!tenant) return <div className="mx-auto max-w-7xl px-4 py-6">Žádný aktivní tenant.</div>;

  const { data: tenantRow } = await sb.from("gss_tenants").select("id").eq("prefix", tenant).maybeSingle();
  if (!tenantRow) return <div className="mx-auto max-w-7xl px-4 py-6">Tenant nenalezen.</div>;

  const page = Math.max(1, Number(sp.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  // Build filtered query
  let query = sb.from("gss_movements")
    .select(`
      id, occurred_at, movement, payload, created_by,
      piece:gss_pieces!gss_movements_piece_id_fkey(dm_code, item_id),
      from_location:gss_locations!gss_movements_from_location_id_fkey(code),
      to_location:gss_locations!gss_movements_to_location_id_fkey(code)
    `, { count: "exact" })
    .eq("tenant_id", tenantRow.id);

  if (sp.mv && MOVEMENT_TYPES.includes(sp.mv)) {
    query = query.eq("movement", sp.mv as "receive"|"issue"|"transfer"|"service_out"|"service_in"|"scrap"|"adjust");
  }
  if (sp.user) {
    query = query.ilike("created_by", `%${sp.user}%`);
  }
  if (sp.from) {
    query = query.gte("occurred_at", sp.from);
  }
  if (sp.to) {
    query = query.lte("occurred_at", sp.to);
  }

  query = query.order("occurred_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const { data, count, error } = await query;

  // dm_code filter — aplikujeme client-side po joinu (PostgREST nepodporuje filtr na join attr easy)
  let rows = (data ?? []) as any[];
  if (sp.dm) {
    const needle = sp.dm.toLowerCase();
    rows = rows.filter((m) => m.piece?.dm_code?.toLowerCase().includes(needle));
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <span className="text-sm text-muted-foreground">
          tenant <span className="font-mono">{tenant}</span> · {total.toLocaleString("cs-CZ")} pohybů celkem
        </span>
      </div>

      <AuditFilters
        initial={{
          dm: sp.dm ?? "", mv: sp.mv ?? "", user: sp.user ?? "",
          from: sp.from ?? "", to: sp.to ?? "",
        }}
        movementTypes={MOVEMENT_TYPES}
      />

      {error && (
        <Card><CardContent className="text-sm text-destructive py-3">Chyba: {error.message}</CardContent></Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[170px]">Čas</TableHead>
                <TableHead className="w-[120px]">Movement</TableHead>
                <TableHead>DM kód</TableHead>
                <TableHead>Z → na</TableHead>
                <TableHead>Kdo</TableHead>
                <TableHead>Payload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id} className="hover:bg-accent/40">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(m.occurred_at)}</TableCell>
                  <TableCell>
                    <StatusBadge status={m.movement} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {m.piece?.item_id ? (
                      <Link href={`/gss/item/${m.piece.item_id}`} className="hover:underline">{m.piece?.dm_code ?? "—"}</Link>
                    ) : (m.piece?.dm_code ?? "—")}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-mono">{m.from_location?.code ?? "—"}</span>
                    {" → "}
                    <span className="font-mono">{m.to_location?.code ?? "—"}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.created_by ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                    {m.payload && Object.keys(m.payload).length > 0 ? JSON.stringify(m.payload) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-12">
                  <EmptyState icon={History} title="Žádné pohyby" description="Pro tyto filtry zatím nic. Zkus jiné rozmezí nebo movement type." />
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AuditPagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}

function AuditPagination({ page, totalPages, total }: { page: number; totalPages: number; total: number }) {
  // Reuse client-side pagination from GPC search
  return <Pagination page={page} totalPages={totalPages} total={total} />;
}
