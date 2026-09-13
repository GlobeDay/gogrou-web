import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getServerUser } from "@/lib/supabase-server";
import type { OverstockOffer } from "@/lib/gss-lock";
import { listPayloadRecords, listWarehouseCards } from "../ops/actions";
import { OverstockForm } from "./overstock-form";

export const dynamic = "force-dynamic";

export default async function OverstockPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/overstock");
  const [items, rawOffers] = await Promise.all([
    listWarehouseCards(),
    listPayloadRecords<OverstockOffer>("overstock_offer"),
  ]);
  const latest = new Map<string, OverstockOffer>();
  for (const offer of rawOffers) {
    if (offer?.item_id && !latest.has(offer.item_id)) latest.set(offer.item_id, offer);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <Link href="/gss/terminal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Terminál
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Nadnormativní zásoby</h1>
      <OverstockForm items={items} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Položka</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Cena / ks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...latest.values()].map((o) => {
                const item = items.find((i) => i.id === o.item_id);
                return (
                  <TableRow key={o.item_id}>
                    <TableCell>{item?.product.name ?? o.item_id}</TableCell>
                    <TableCell className="text-right font-mono">{o.qty}</TableCell>
                    <TableCell className="text-right font-mono">{o.price}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
