import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { getActiveTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/items");

  const [sb, tenant] = await Promise.all([getServerSupabase(), getActiveTenant()]);
  if (!tenant) return <div className="mx-auto max-w-7xl px-4 py-6">Žádný aktivní tenant.</div>;

  // Resolve tenant uuid (RLS by stejně omezila)
  const { data: tenantRow } = await sb.from("gss_tenants").select("id").eq("prefix", tenant).maybeSingle();
  if (!tenantRow) return <div className="mx-auto max-w-7xl px-4 py-6">Tenant {tenant} nenalezen.</div>;

  // Items + product info + pieces count by status
  const { data, error } = await sb
    .from("gss_items")
    .select(`
      id, reorder_point, min_qty, max_qty, created_at,
      tracking_mode, qty_on_hand, local_name, local_type,
      product:gpc_products(id, gid, type, name),
      pieces:gss_pieces!gss_pieces_item_id_fkey(id, status)
    `)
    .eq("tenant_id", tenantRow.id)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return <div className="mx-auto max-w-7xl px-4 py-6 text-destructive">Chyba: {error.message}</div>;

  type ItemRow = {
    id: string;
    reorder_point: number | null;
    min_qty: number | null;
    max_qty: number | null;
    created_at: string;
    tracking_mode: string;
    qty_on_hand: number;
    local_name: string | null;
    local_type: string | null;
    product: { id: string; gid: string; type: string; name: string } | null;
    pieces: Array<{ id: string; status: string }> | null;
  };
  const rows = ((data ?? []) as unknown as ItemRow[]).map((it) => {
    const status = it.pieces?.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1; return acc;
    }, {}) ?? {};
    return {
      it,
      status,
      isLocal: !it.product,
      product: it.product ?? {
        id: null,
        gid: "LOCAL",
        type: it.local_type ?? "local",
        name: it.local_name ?? "(bez názvu)",
      },
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Skladové karty</h1>
          <Link href="/gss/terminal" className="text-sm underline">Terminál</Link>
          <Link href="/gss/adopt" className="text-sm underline">Převzít z GPC</Link>
          <Link href="/gss/local-item" className="text-sm underline">Lokální položka</Link>
        </div>
        <span className="text-sm text-muted-foreground">
          tenant <span className="font-mono">{tenant}</span> · {rows.length} položek
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produkt</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="text-right w-[90px]">In stock</TableHead>
                <TableHead className="text-right w-[90px]">In machine</TableHead>
                <TableHead className="text-right w-[90px]">In service</TableHead>
                <TableHead className="text-right w-[90px]">Reorder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ it, status, isLocal, product }) => {
                // qty_on_hand (bez DM) + fyzické kusy na skladě
                const inStock = (status.in_stock ?? 0) + (it.qty_on_hand ?? 0);
                const reorder = (it.reorder_point ?? 0);
                const lowStock = reorder > 0 && inStock < reorder;
                return (
                  <TableRow key={it.id} className="hover:bg-accent/40">
                    <TableCell>
                      <Link href={`/gss/item/${it.id}`} className="hover:underline">
                        <div className="font-medium">
                          {product.name}
                          {isLocal && <Badge variant="destructive" className="ml-2 text-2xs">LOKÁLNÍ</Badge>}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">{product.gid}</div>
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{product.type}</Badge></TableCell>
                    <TableCell className={`text-right font-mono ${lowStock ? "text-destructive font-bold" : ""}`}>{inStock}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{status.in_machine ?? 0}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{status.in_service ?? 0}</TableCell>
                    <TableCell className="text-right font-mono">{it.reorder_point ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Žádné skladové karty.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
