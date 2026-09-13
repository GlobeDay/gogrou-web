import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { can } from "@/lib/tenant";
import { fmtDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ItemStockActions } from "./item-stock-actions";

type Params = Promise<{ id: string }>;

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  new: "Nový", in_stock: "Sklad", in_preset: "Preset",
  in_machine: "Stroj", in_production: "Výroba", in_service: "Servis", scrapped: "Vyřazeno",
};

export default async function ItemDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) redirect(`/login?next=/gss/item/${id}`);

  const sb = await getServerSupabase();

  // Načti item + product + locations + pieces + movements paralelně
  const [itemRes, piecesRes, movementsRes] = await Promise.all([
    sb.from("gss_items")
      .select(`id, reorder_point, min_qty, max_qty, notes, created_at, updated_at,
               product:gpc_products!inner(id, gid, type, name, manufacturer),
               tenant:gss_tenants!inner(prefix, name)`)
      .eq("id", id).maybeSingle(),
    sb.from("gss_pieces")
      .select(`id, dm_code, status, lifecycle, updated_at,
               location:gss_locations!gss_pieces_current_location_id_fkey(code, name)`)
      .eq("item_id", id)
      .order("updated_at", { ascending: false }),
    sb.from("gss_movements")
      .select(`id, occurred_at, movement, payload, created_by,
               piece:gss_pieces!inner(dm_code),
               from_location:gss_locations!gss_movements_from_location_id_fkey(code),
               to_location:gss_locations!gss_movements_to_location_id_fkey(code)`)
      .eq("item_id", id)
      .order("occurred_at", { ascending: false })
      .limit(100),
  ]);

  if (itemRes.error || !itemRes.data) notFound();
  const item   = itemRes.data as any;
  const pieces = (piecesRes.data ?? []) as any[];
  const movs   = (movementsRes.data ?? []) as any[];

  // Status counts
  const counts: Record<string, number> = {};
  for (const p of pieces) counts[p.status] = (counts[p.status] ?? 0) + 1;

  const inStock = counts.in_stock ?? 0;
  const sharpenableCount =
    (counts.in_machine ?? 0) +
    (counts.in_production ?? 0) +
    (counts.in_preset ?? 0) +
    inStock;
  const reorder = item.reorder_point ?? 0;
  const isLowStock = reorder > 0 && inStock < reorder;
  const canAct = await can("gss.transfer");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <Link href="/gss/items" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Zpět na seznam
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <Link href={`/gpc/${item.product.id}`} className="hover:underline">{item.product.name}</Link>
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            <span className="font-mono">{item.product.gid}</span> · {item.product.manufacturer ?? "—"} · tenant <span className="font-mono">{item.tenant.prefix}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          <Badge variant="outline" className="font-mono">{item.product.type}</Badge>
        </div>
      </div>

      <Separator />

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {["in_stock", "in_machine", "in_preset", "in_service", "in_production", "scrapped"].map((s) => (
          <Card key={s} className={s === "in_stock" && isLowStock ? "border-destructive" : ""}>
            <CardHeader className="pb-1">
              <CardDescription className="text-2xs uppercase tracking-wide">{STATUS_LABELS[s]}</CardDescription>
              <CardTitle className={`text-2xl ${s === "in_stock" && isLowStock ? "text-destructive" : ""}`}>{counts[s] ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <ItemStockActions
        itemId={id}
        canAct={canAct}
        inStockCount={inStock}
        sharpenableCount={sharpenableCount}
      />

      {/* Policy */}
      <Card>
        <CardHeader className="pb-2"><CardDescription>Policy</CardDescription></CardHeader>
        <CardContent className="text-sm flex flex-wrap gap-x-6 gap-y-1">
          <span>Min: <span className="font-mono">{item.min_qty ?? "—"}</span></span>
          <span>Reorder point: <span className={`font-mono ${isLowStock ? "text-destructive font-bold" : ""}`}>{item.reorder_point ?? "—"}</span></span>
          <span>Max: <span className="font-mono">{item.max_qty ?? "—"}</span></span>
          {item.notes && <span className="text-muted-foreground">📝 {item.notes}</span>}
        </CardContent>
      </Card>

      <Tabs defaultValue="pieces">
        <TabsList>
          <TabsTrigger value="pieces">Kusy ({pieces.length})</TabsTrigger>
          <TabsTrigger value="movements">Pohyby ({movs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pieces">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DM code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lokace</TableHead>
                    <TableHead className="text-right">Cycles done</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pieces.map((p) => {
                    const cyc = p.lifecycle?.sharpening?.cycles_done;
                    const max = p.lifecycle?.sharpening?.max_cycles;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link href={`/gss/scan?dm=${encodeURIComponent(p.dm_code)}`} className="font-mono text-xs hover:underline">
                            {p.dm_code}
                          </Link>
                        </TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell className="font-mono text-xs">{p.location?.code ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{cyc ?? "—"}{max ? ` / ${max}` : ""}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{fmtDate(p.updated_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {pieces.length === 0 && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Žádné kusy.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Čas</TableHead>
                    <TableHead>DM</TableHead>
                    <TableHead className="w-[120px]">Movement</TableHead>
                    <TableHead>Z → na</TableHead>
                    <TableHead>Kdo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movs.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(m.occurred_at)}</TableCell>
                      <TableCell className="font-mono text-xs">{m.piece?.dm_code ?? "—"}</TableCell>
                      <TableCell><StatusBadge status={m.movement} /></TableCell>
                      <TableCell className="text-xs">
                        <span className="font-mono">{m.from_location?.code ?? "—"}</span>
                        {" → "}
                        <span className="font-mono">{m.to_location?.code ?? "—"}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.created_by ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {movs.length === 0 && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Zatím žádné pohyby.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground">
        Card created: {fmtDate(item.created_at)} · updated: {fmtDate(item.updated_at)}
      </div>
    </div>
  );
}
