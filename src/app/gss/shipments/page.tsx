import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getServerUser } from "@/lib/supabase-server";
import type { ServiceShipment } from "@/lib/gss-lock";
import { SHIPMENT_STATUS_LABELS } from "@/lib/gss-lock";
import { listPayloadRecords } from "../ops/actions";
import { ShipmentForm } from "./shipment-form";

export const dynamic = "force-dynamic";

export default async function ShipmentsPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/shipments");
  const raw = await listPayloadRecords<ServiceShipment>("service_shipment");
  const latest = new Map<string, ServiceShipment>();
  for (const s of raw) {
    if (s?.id && !latest.has(s.id)) latest.set(s.id, s);
  }
  const rows = [...latest.values()];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <Link href="/gss/terminal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Terminál
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Servisní zásilky</h1>
      <p className="text-sm text-muted-foreground">Soft MVP — stav zásilky se ukládá do audit pohybů.</p>
      <ShipmentForm />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Číslo</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead>Zákazník</TableHead>
                <TableHead>DM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.number}</TableCell>
                  <TableCell>{SHIPMENT_STATUS_LABELS[s.status] ?? s.status}</TableCell>
                  <TableCell>{s.customer}</TableCell>
                  <TableCell className="font-mono text-xs">{s.items.map((i) => i.dm_code).join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
