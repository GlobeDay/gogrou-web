import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { can, getActiveTenant } from "@/lib/tenant";
import { ORDER_STATUS_LABELS, TRACKING_MODE_LABELS, type OrderStatus, type TrackingMode } from "@/lib/gss-lock";
import { OrderStatusButtons, ReceiveLineForm } from "../order-controls";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) redirect(`/login?next=/gss/orders/${id}`);

  const [sb, tenant, canEdit] = await Promise.all([
    getServerSupabase(),
    getActiveTenant(),
    can("gss.edit_lifecycle"),
  ]);
  if (!tenant) return <div className="mx-auto max-w-4xl px-4 py-6">Žádný aktivní tenant.</div>;
  const { data: tenantRow } = await sb.from("gss_tenants").select("id").eq("prefix", tenant).maybeSingle();
  if (!tenantRow) return <div className="mx-auto max-w-4xl px-4 py-6">Tenant {tenant} nenalezen.</div>;

  const [{ data: order }, { data: linesData }] = await Promise.all([
    sb
      .from("gss_orders")
      .select("id, order_no, supplier, status, note, created_at, created_by")
      .eq("id", id)
      .eq("tenant_id", tenantRow.id)
      .maybeSingle(),
    sb
      .from("gss_order_lines")
      .select("id, qty_ordered, qty_received, note, item:gss_items!inner(id, tracking_mode, local_name, product:gpc_products(name, gid))")
      .eq("order_id", id)
      .eq("tenant_id", tenantRow.id)
      .order("created_at", { ascending: true }),
  ]);
  if (!order) notFound();

  type LineRow = {
    id: string;
    qty_ordered: number;
    qty_received: number | null;
    note: string | null;
    item: {
      id: string;
      tracking_mode: TrackingMode;
      local_name: string | null;
      product: { name: string; gid: string } | null;
    };
  };
  const lines = ((linesData ?? []) as unknown as LineRow[]).map((l) => ({
    ...l,
    received: l.qty_received ?? 0,
    remaining: l.qty_ordered - (l.qty_received ?? 0),
    name: l.item.product?.name ?? l.item.local_name ?? "(bez názvu)",
    gid: l.item.product?.gid ?? "LOCAL",
  }));

  const receivable = order.status === "ordered" || order.status === "partially_received";
  const status = order.status as OrderStatus;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <Link href="/gss/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Objednávky
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">{order.order_no}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dodavatel: <span className="font-medium text-foreground">{order.supplier ?? "—"}</span>
            {" · "}založeno {new Date(order.created_at).toLocaleString("cs-CZ")}
            {order.created_by ? ` · ${order.created_by}` : ""}
          </p>
          {order.note && <p className="text-sm text-muted-foreground mt-1">{order.note}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={status === "cancelled" ? "destructive" : status === "draft" ? "outline" : "default"}>
            {ORDER_STATUS_LABELS[status]}
          </Badge>
          {canEdit && <OrderStatusButtons orderId={order.id} status={order.status} />}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Řádky objednávky</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Položka</TableHead>
                <TableHead className="w-[150px]">Režim</TableHead>
                <TableHead className="text-right w-[100px]">Objednáno</TableHead>
                <TableHead className="text-right w-[90px]">Přijato</TableHead>
                <TableHead className="text-right w-[90px]">Zbývá</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Link href={`/gss/item/${l.item.id}`} className="hover:underline">
                      <div className="font-medium">{l.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{l.gid}</div>
                    </Link>
                    {l.note && <div className="text-xs text-muted-foreground mt-0.5">{l.note}</div>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {TRACKING_MODE_LABELS[l.item.tracking_mode]}
                  </TableCell>
                  <TableCell className="text-right font-mono">{l.qty_ordered}</TableCell>
                  <TableCell className="text-right font-mono">{l.received}</TableCell>
                  <TableCell className={`text-right font-mono ${l.remaining > 0 ? "font-semibold" : "text-muted-foreground"}`}>
                    {Math.max(l.remaining, 0)}
                  </TableCell>
                </TableRow>
              ))}
              {lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Objednávka nemá řádky.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {receivable && lines.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Příjem na objednávku</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {lines.map((l) => (
              <div key={l.id} className="space-y-1.5">
                <p className="text-sm">
                  <span className="font-medium">{l.name}</span>
                  <span className="text-muted-foreground"> · přijato {l.received}/{l.qty_ordered}, zbývá {Math.max(l.remaining, 0)} ks</span>
                </p>
                <ReceiveLineForm lineId={l.id} remaining={l.remaining} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
