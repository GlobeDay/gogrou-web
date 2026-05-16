import Link from "next/link";
import { redirect } from "next/navigation";
import { FileDown, FileJson } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { getActiveTenant } from "@/lib/tenant";
import { computeLowStock } from "@/lib/low-stock";

export const dynamic = "force-dynamic";

export default async function LowStockPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/low-stock");

  const [sb, tenant] = await Promise.all([getServerSupabase(), getActiveTenant()]);
  if (!tenant) {
    return <div className="mx-auto max-w-7xl px-4 py-6"><Card><CardContent className="py-4 text-sm">Žádný aktivní tenant.</CardContent></Card></div>;
  }

  const { data: tenantRow } = await sb.from("gss_tenants").select("id").eq("prefix", tenant).maybeSingle();
  if (!tenantRow) return null;

  let items: Awaited<ReturnType<typeof computeLowStock>> = [];
  let err: string | null = null;
  try { items = await computeLowStock(sb, tenantRow.id); }
  catch (e) { err = e instanceof Error ? e.message : String(e); }

  const generatedAt = new Date();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Low stock</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            tenant <span className="font-mono">{tenant}</span> · {items.length} pod reorder · {generatedAt.toLocaleString("cs-CZ")}
          </span>
          {items.length > 0 && (
            <div className="flex gap-1">
              <a href="/api/purchase-proposal?format=csv" download>
                <Button size="sm" variant="outline"><FileDown className="h-4 w-4 mr-1" /> CSV</Button>
              </a>
              <a href="/api/purchase-proposal?format=json" download>
                <Button size="sm" variant="outline"><FileJson className="h-4 w-4 mr-1" /> JSON</Button>
              </a>
            </div>
          )}
        </div>
      </div>

      {err && <Card><CardContent className="text-sm text-destructive py-3">Chyba: {err}</CardContent></Card>}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produkt</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="text-right w-[100px]">In stock</TableHead>
                <TableHead className="text-right w-[100px]">In machine</TableHead>
                <TableHead className="text-right w-[100px]">In service</TableHead>
                <TableHead className="text-right w-[100px]">Reorder</TableHead>
                <TableHead className="text-right w-[100px]">Suggested qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => {
                const critical = it.in_stock_qty === 0;
                return (
                  <TableRow key={it.item_id} className="hover:bg-accent/40">
                    <TableCell>
                      <Link href={`/gpc/${it.product_id}`} className="hover:underline">
                        <div className="font-medium">{it.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{it.gid}</div>
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{it.type}</Badge></TableCell>
                    <TableCell className={`text-right font-mono ${critical ? "text-destructive font-bold" : ""}`}>{it.in_stock_qty}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{it.in_production_qty}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{it.in_service_qty}</TableCell>
                    <TableCell className="text-right font-mono">{it.reorder_point ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{it.suggested_qty}</TableCell>
                  </TableRow>
                );
              })}
              {items.length === 0 && !err && (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Žádné položky pod reorder.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
