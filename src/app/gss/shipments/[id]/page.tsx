import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import {
  SHIPMENT_DIRECTION_LABELS,
  SHIPMENT_STATUS_LABELS,
  type ShipmentDirection,
  type ShipmentStatus,
} from "@/lib/gss-lock";
import { ShipmentControls } from "../shipment-controls";

type Params = Promise<{ id: string }>;

export const dynamic = "force-dynamic";

type LineRow = {
  id: string;
  qty: number;
  result: string | null;
  note: string | null;
  piece: { dm_code: string; status: string; condition: string | null } | null;
  item: {
    id: string;
    local_name: string | null;
    tracking_mode: string;
    product: { name: string; gid: string } | null;
  } | null;
};

export default async function ShipmentDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) redirect(`/login?next=/gss/shipments/${id}`);

  const sb = await getServerSupabase();
  const [shipmentRes, returnRes] = await Promise.all([
    sb.from("gss_service_shipments")
      .select(`id, number, direction, status, partner, customer, order_ref, note, created_at, return_of,
               lines:gss_service_shipment_lines(id, qty, result, note,
                 piece:gss_pieces(dm_code, status, condition),
                 item:gss_items(id, local_name, tracking_mode, product:gpc_products(name, gid)))`)
      .eq("id", id)
      .maybeSingle(),
    sb.from("gss_service_shipments")
      .select("id, number, status")
      .eq("return_of", id)
      .maybeSingle(),
  ]);
  if (shipmentRes.error || !shipmentRes.data) notFound();
  const shipment = shipmentRes.data as unknown as {
    id: string;
    number: string;
    direction: ShipmentDirection;
    status: string;
    partner: string | null;
    customer: string | null;
    order_ref: string | null;
    note: string | null;
    created_at: string;
    return_of: string | null;
    lines: LineRow[];
  };
  const returnShipment = returnRes.data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <Link href="/gss/shipments" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Servisní zásilky
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-2xs uppercase tracking-label text-muted-foreground">
            {SHIPMENT_DIRECTION_LABELS[shipment.direction] ?? shipment.direction}
          </p>
          <h1 className="font-mono text-2xl font-bold tracking-tight">{shipment.number}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {shipment.partner ?? "—"}
            {shipment.customer ? ` · zákazník ${shipment.customer}` : ""}
            {shipment.order_ref ? ` · zakázka ${shipment.order_ref}` : ""}
            {" · "}{new Date(shipment.created_at).toLocaleString("cs-CZ")}
          </p>
          {shipment.note && <p className="text-sm text-muted-foreground mt-1">{shipment.note}</p>}
        </div>
        <Badge variant="secondary" className="text-sm">
          {SHIPMENT_STATUS_LABELS[shipment.status as ShipmentStatus] ?? shipment.status}
        </Badge>
      </div>

      {(shipment.return_of || returnShipment) && (
        <p className="text-sm">
          {shipment.return_of && (
            <Link href={`/gss/shipments/${shipment.return_of}`} className="underline">← Původní zásilka do brusírny</Link>
          )}
          {returnShipment && (
            <Link href={`/gss/shipments/${returnShipment.id}`} className="underline">
              Návratová zásilka {returnShipment.number} ({SHIPMENT_STATUS_LABELS[returnShipment.status as ShipmentStatus] ?? returnShipment.status}) →
            </Link>
          )}
        </p>
      )}

      <ShipmentControls
        shipmentId={shipment.id}
        direction={shipment.direction}
        status={shipment.status}
        hasReturn={Boolean(returnShipment)}
      />

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Řádky ({shipment.lines.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kus / položka</TableHead>
                <TableHead className="text-right w-[70px]">Ks</TableHead>
                <TableHead className="w-[130px]">Stav kusu</TableHead>
                <TableHead className="w-[120px]">Výsledek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipment.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    {l.piece ? (
                      <Link href={`/gss/piece/${encodeURIComponent(l.piece.dm_code)}`} className="font-mono text-sm hover:underline">
                        {l.piece.dm_code}
                      </Link>
                    ) : l.item ? (
                      <Link href={`/gss/item/${l.item.id}`} className="text-sm hover:underline">
                        {l.item.product?.name ?? l.item.local_name ?? "(bez názvu)"}
                        <span className="font-mono text-xs text-muted-foreground"> · {l.item.product?.gid ?? "LOCAL"} · bez DM</span>
                      </Link>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">{l.qty}</TableCell>
                  <TableCell>{l.piece ? <StatusBadge status={l.piece.status} /> : <span className="text-xs text-muted-foreground">množstevní</span>}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{l.result ?? "—"}</TableCell>
                </TableRow>
              ))}
              {shipment.lines.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Zásilka nemá řádky.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
