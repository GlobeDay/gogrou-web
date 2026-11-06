import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { getActiveTenant } from "@/lib/tenant";
import {
  SHIPMENT_DIRECTION_LABELS,
  SHIPMENT_STATUS_LABELS,
  type ShipmentDirection,
  type ShipmentStatus,
} from "@/lib/gss-lock";
import { listWarehouseCards } from "../ops/actions";
import { NewShipmentForm } from "./new-shipment-form";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  sent_to_service: "secondary",
  received_by_service: "secondary",
  in_progress: "secondary",
  partial: "secondary",
  done: "default",
  ready: "secondary",
  shipped: "secondary",
  received_by_customer: "default",
  closed: "outline",
  cancelled: "destructive",
};

type ShipmentRow = {
  id: string;
  number: string;
  direction: ShipmentDirection;
  status: string;
  partner: string | null;
  customer: string | null;
  created_at: string;
  lines: Array<{ id: string }>;
};

export default async function ShipmentsPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/shipments");

  const [sb, tenant, cards] = await Promise.all([
    getServerSupabase(),
    getActiveTenant(),
    listWarehouseCards(),
  ]);
  if (!tenant) {
    return <div className="mx-auto max-w-4xl px-4 py-6"><Card><CardContent className="py-4 text-sm">Žádný aktivní tenant.</CardContent></Card></div>;
  }
  const { data: tenantRow } = await sb.from("gss_tenants").select("id").eq("prefix", tenant).maybeSingle();
  if (!tenantRow) return null;

  const { data, error } = await sb
    .from("gss_service_shipments")
    .select("id, number, direction, status, partner, customer, created_at, lines:gss_service_shipment_lines(id)")
    .eq("tenant_id", tenantRow.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as unknown as ShipmentRow[];

  const quantityItems = cards
    .filter((c) => c.tracking_mode === "quantity")
    .map((c) => ({
      id: c.id,
      label: `${c.product.name} · ${c.product.gid}`,
      keywords: c.product.manufacturer ?? undefined,
    }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <Link href="/gss/terminal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Terminál
      </Link>
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Servisní zásilky</h1>
        <span className="text-sm text-muted-foreground">
          tenant <span className="font-mono">{tenant}</span> · {rows.length} zásilek
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Třífázové workflow: zákazník → brusírna → zákazník. Návrat vzniká jako samostatná zásilka navázaná na původní.
      </p>

      <NewShipmentForm quantityItems={quantityItems} />

      {error && <Card><CardContent className="py-3 text-sm text-destructive">Chyba: {error.message}</CardContent></Card>}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Číslo</TableHead>
                <TableHead>Směr</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Zákazník</TableHead>
                <TableHead className="text-right">Řádků</TableHead>
                <TableHead className="text-right">Založeno</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id} className="hover:bg-accent/40">
                  <TableCell>
                    <Link href={`/gss/shipments/${s.id}`} className="font-mono text-xs hover:underline">{s.number}</Link>
                  </TableCell>
                  <TableCell className="text-sm">{SHIPMENT_DIRECTION_LABELS[s.direction] ?? s.direction}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[s.status] ?? "outline"}>
                      {SHIPMENT_STATUS_LABELS[s.status as ShipmentStatus] ?? s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{s.partner ?? "—"}</TableCell>
                  <TableCell className="text-sm">{s.customer ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono">{s.lines.length}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("cs-CZ")}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !error && (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Zatím žádné zásilky.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
