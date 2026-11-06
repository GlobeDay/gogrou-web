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
import { getClassSchema } from "@/lib/class-schema";
import { CONDITION_LABELS, TRACKING_MODE_LABELS, asLifecycle, type PieceCondition } from "@/lib/gss-lock";
import { StatusBadge } from "@/components/status-badge";
import { ItemStockActions } from "./item-stock-actions";
import { ItemSettings } from "./item-settings";
import { RequestValidation } from "./request-validation";

type Params = Promise<{ id: string }>;

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  new: "Nový", in_stock: "Sklad", in_preset: "Preset",
  in_machine: "Stroj", in_production: "Výroba", awaiting_decision: "Čeká na rozhodnutí",
  in_service: "Servis", scrapped: "Vyřazeno",
};

export default async function ItemDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) redirect(`/login?next=/gss/item/${id}`);

  const sb = await getServerSupabase();

  // Načti item + product + locations + pieces + movements paralelně
  const [itemRes, piecesRes, movementsRes, validationRes] = await Promise.all([
    sb.from("gss_items")
      .select(`id, reorder_point, min_qty, max_qty, notes, created_at, updated_at,
               tracking_mode, qty_on_hand, pack_size, supplier_primary, supplier_secondary,
               local_name, local_manufacturer, local_type,
               product:gpc_products(id, gid, type, name, manufacturer, params),
               tenant:gss_tenants!inner(prefix, name)`)
      .eq("id", id).maybeSingle(),
    sb.from("gss_pieces")
      .select(`id, dm_code, status, condition, qid, lifecycle, updated_at,
               location:gss_locations!gss_pieces_current_location_id_fkey(code, name)`)
      .eq("item_id", id)
      .order("updated_at", { ascending: false }),
    sb.from("gss_movements")
      .select(`id, occurred_at, movement, quantity, payload, created_by,
               piece:gss_pieces(dm_code),
               from_location:gss_locations!gss_movements_from_location_id_fkey(code),
               to_location:gss_locations!gss_movements_to_location_id_fkey(code)`)
      .eq("item_id", id)
      .order("occurred_at", { ascending: false })
      .limit(100),
    sb.from("gss_gpc_validation_requests")
      .select("id, status")
      .eq("item_id", id)
      .eq("status", "pending")
      .maybeSingle(),
  ]);

  if (itemRes.error || !itemRes.data) notFound();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const item   = itemRes.data as any;
  const pieces = (piecesRes.data ?? []) as any[];
  const movs   = (movementsRes.data ?? []) as any[];
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const isLocal = !item.product;
  const display = item.product ?? {
    id: null,
    gid: "LOCAL",
    type: item.local_type ?? "local",
    name: item.local_name ?? "(bez názvu)",
    manufacturer: item.local_manufacturer,
    params: null,
  };
  const quantityMode = item.tracking_mode === "quantity";

  // GPC technická data read-only v GSS kartě (AT-011)
  const schema = !isLocal && display.params ? await getClassSchema(display.type) : [];
  const paramEntries = !isLocal && display.params
    ? Object.entries(display.params as Record<string, unknown>)
        .filter(([, v]) => v !== null && v !== "" && typeof v !== "object")
    : [];
  const paramLabel = (code: string) => {
    const def = schema.find((p) => p.param_code === code);
    if (!def) return code;
    return `${def.label_cs ?? def.label_en ?? code}${def.unit ? ` [${def.unit}]` : ""}`;
  };

  // Status counts
  const counts: Record<string, number> = {};
  for (const p of pieces) counts[p.status] = (counts[p.status] ?? 0) + 1;

  const inStock = counts.in_stock ?? 0;
  const sharpenableCount =
    (counts.in_machine ?? 0) +
    (counts.in_production ?? 0) +
    (counts.in_preset ?? 0) +
    inStock;
  const totalAvailable = inStock + (quantityMode ? item.qty_on_hand : 0);
  const reorder = item.reorder_point ?? 0;
  const isLowStock = reorder > 0 && totalAvailable < reorder;
  const canAct = await can("gss.transfer");
  const canEditLifecycle = await can("gss.edit_lifecycle");

  // Souhrn kondice × lokace (AT-007) — jen živé kusy
  const livePieces = pieces.filter((p) => p.status !== "scrapped");
  const locationCodes = [...new Set(livePieces.map((p) => p.location?.code ?? "—"))].sort();
  const matrix = new Map<string, Map<string, number>>();
  for (const p of livePieces) {
    const cond = (p.condition ?? "new") as string;
    const loc = p.location?.code ?? "—";
    if (!matrix.has(cond)) matrix.set(cond, new Map());
    const row = matrix.get(cond)!;
    row.set(loc, (row.get(loc) ?? 0) + 1);
  }
  const reservedCount = livePieces.filter((p) => asLifecycle(p.lifecycle).reservation?.active).length;
  const blockedCount = livePieces.filter((p) => asLifecycle(p.lifecycle).blocked).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <Link href="/gss/items" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Zpět na seznam
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isLocal ? (
              display.name
            ) : (
              <Link href={`/gpc/${display.id}`} className="hover:underline">{display.name}</Link>
            )}
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            <span className="font-mono">{display.gid}</span> · {display.manufacturer ?? "—"} · tenant <span className="font-mono">{item.tenant.prefix}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          <Badge variant="outline" className="font-mono">{display.type}</Badge>
          <Badge variant={quantityMode ? "secondary" : "outline"}>
            {TRACKING_MODE_LABELS[item.tracking_mode as keyof typeof TRACKING_MODE_LABELS] ?? item.tracking_mode}
          </Badge>
          {isLocal && <Badge variant="destructive">LOKÁLNÍ · NEVALIDOVÁNO</Badge>}
        </div>
      </div>

      {isLocal && canEditLifecycle && (
        <Card>
          <CardHeader className="pb-2"><CardDescription>Lokální položka (jen v GSS)</CardDescription></CardHeader>
          <CardContent>
            <RequestValidation itemId={id} pending={Boolean(validationRes.data)} />
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {quantityMode && (
          <Card className={isLowStock ? "border-destructive" : ""}>
            <CardHeader className="pb-1">
              <CardDescription className="text-2xs uppercase tracking-wide">Sklad (bez DM)</CardDescription>
              <CardTitle className={`text-2xl ${isLowStock ? "text-destructive" : ""}`}>{item.qty_on_hand}</CardTitle>
            </CardHeader>
          </Card>
        )}
        {["in_stock", "in_machine", "in_preset", "in_service", "in_production", "awaiting_decision", "scrapped"].map((s) => (
          <Card key={s} className={s === "in_stock" && isLowStock && !quantityMode ? "border-destructive" : ""}>
            <CardHeader className="pb-1">
              <CardDescription className="text-2xs uppercase tracking-wide">{STATUS_LABELS[s]}</CardDescription>
              <CardTitle className={`text-2xl ${s === "in_stock" && isLowStock && !quantityMode ? "text-destructive" : ""}`}>{counts[s] ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Souhrn kondice × lokace (DM kusy) */}
      {livePieces.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Kondice × lokace
              {reservedCount > 0 && <Badge variant="outline" className="ml-2">{reservedCount}× rezervováno</Badge>}
              {blockedCount > 0 && <Badge variant="destructive" className="ml-2">{blockedCount}× blokováno</Badge>}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kondice</TableHead>
                  {locationCodes.map((loc) => (
                    <TableHead key={loc} className="text-right font-mono text-xs">{loc}</TableHead>
                  ))}
                  <TableHead className="text-right">Celkem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Object.keys(CONDITION_LABELS) as PieceCondition[])
                  .filter((cond) => matrix.has(cond))
                  .map((cond) => {
                    const row = matrix.get(cond)!;
                    const total = [...row.values()].reduce((a, b) => a + b, 0);
                    return (
                      <TableRow key={cond}>
                        <TableCell>{CONDITION_LABELS[cond]}</TableCell>
                        {locationCodes.map((loc) => (
                          <TableCell key={loc} className="text-right font-mono text-xs">{row.get(loc) ?? "—"}</TableCell>
                        ))}
                        <TableCell className="text-right font-mono font-bold">{total}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ItemStockActions
        itemId={id}
        canAct={canAct}
        inStockCount={inStock}
        sharpenableCount={sharpenableCount}
        trackingMode={item.tracking_mode}
        qtyOnHand={item.qty_on_hand}
      />

      {/* Policy */}
      <Card>
        <CardHeader className="pb-2"><CardDescription>Policy</CardDescription></CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span>Min: <span className="font-mono">{item.min_qty ?? "—"}</span></span>
            <span>Reorder point: <span className={`font-mono ${isLowStock ? "text-destructive font-bold" : ""}`}>{item.reorder_point ?? "—"}</span></span>
            <span>Max: <span className="font-mono">{item.max_qty ?? "—"}</span></span>
            <span>Balení: <span className="font-mono">{item.pack_size ?? "—"}</span></span>
            <span>Dodavatel: <span className="font-mono">{item.supplier_primary ?? "—"}</span>{item.supplier_secondary ? <span className="text-muted-foreground"> / {item.supplier_secondary}</span> : null}</span>
            {item.notes && <span className="text-muted-foreground">{item.notes}</span>}
          </div>
          <ItemSettings
            itemId={id}
            min_qty={item.min_qty}
            max_qty={item.max_qty}
            reorder_point={item.reorder_point}
            notes={item.notes}
            pack_size={item.pack_size}
            supplier_primary={item.supplier_primary}
            supplier_secondary={item.supplier_secondary}
            tracking_mode={item.tracking_mode}
            canAct={canAct}
          />
        </CardContent>
      </Card>

      {/* GPC technická data — read-only, zdrojem pravdy zůstává GPC */}
      {paramEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Technická data z GPC (read-only) ·{" "}
              <Link href={`/gpc/${display.id}`} className="hover:underline">otevřít v katalogu</Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3 lg:grid-cols-4">
              {paramEntries.map(([code, value]) => (
                <div key={code} className="flex justify-between gap-2 border-b border-border/40 py-1">
                  <span className="text-muted-foreground truncate" title={code}>{paramLabel(code)}</span>
                  <span className="font-mono text-xs">{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                    <TableHead>QID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kondice</TableHead>
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
                          <Link href={`/gss/piece/${encodeURIComponent(p.dm_code)}`} className="font-mono text-xs hover:underline">
                            {p.dm_code}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{p.qid ?? "—"}</TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell className="text-xs">{p.condition ? CONDITION_LABELS[p.condition as PieceCondition] ?? p.condition : "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{p.location?.code ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{cyc ?? "—"}{max ? ` / ${max}` : ""}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{fmtDate(p.updated_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {pieces.length === 0 && <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">Žádné kusy{quantityMode ? " — množstevní položka eviduje jen počty" : ""}.</TableCell></TableRow>}
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
                    <TableHead className="text-right">Ks</TableHead>
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
                      <TableCell className="text-right font-mono text-xs">{m.quantity ?? 1}</TableCell>
                      <TableCell className="text-xs">
                        <span className="font-mono">{m.from_location?.code ?? "—"}</span>
                        {" → "}
                        <span className="font-mono">{m.to_location?.code ?? "—"}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.created_by ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {movs.length === 0 && <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">Zatím žádné pohyby.</TableCell></TableRow>}
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
