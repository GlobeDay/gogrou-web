import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { can, getActiveTenant } from "@/lib/tenant";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/gss-lock";
import { CreateOrdersButton } from "./order-controls";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  ordered: "default",
  partially_received: "secondary",
  received: "secondary",
  cancelled: "destructive",
};

export default async function OrdersPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/orders");

  const [sb, tenant, canEdit] = await Promise.all([
    getServerSupabase(),
    getActiveTenant(),
    can("gss.edit_lifecycle"),
  ]);
  if (!tenant) return <div className="mx-auto max-w-5xl px-4 py-6">Žádný aktivní tenant.</div>;
  const { data: tenantRow } = await sb.from("gss_tenants").select("id").eq("prefix", tenant).maybeSingle();
  if (!tenantRow) return <div className="mx-auto max-w-5xl px-4 py-6">Tenant {tenant} nenalezen.</div>;

  const { data, error } = await sb
    .from("gss_orders")
    .select("id, order_no, supplier, status, note, created_at, created_by, lines:gss_order_lines(qty_ordered, qty_received)")
    .eq("tenant_id", tenantRow.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return <div className="mx-auto max-w-5xl px-4 py-6 text-destructive">Chyba: {error.message}</div>;

  const orders = (data ?? []).map((o) => {
    const lines = o.lines ?? [];
    return {
      ...o,
      lineCount: lines.length,
      ordered: lines.reduce((s, l) => s + l.qty_ordered, 0),
      received: lines.reduce((s, l) => s + (l.qty_received ?? 0), 0),
    };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Objednávky</h1>
          <Link href="/gss/low-stock" className="text-sm underline">Objednávkový návrh</Link>
          <Link href="/gss/terminal" className="text-sm underline">Terminál</Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            tenant <span className="font-mono">{tenant}</span> · {orders.length} objednávek
          </span>
          {canEdit && <CreateOrdersButton />}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Návrhy vznikají z low-stocku seskupené podle primárního dodavatele, množství zaokrouhlené na balení.
        Příjem se páruje na řádky objednávky (objednáno / přijato / zbývá).
      </p>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objednávka</TableHead>
                <TableHead>Dodavatel</TableHead>
                <TableHead className="w-[150px]">Stav</TableHead>
                <TableHead className="text-right w-[90px]">Položek</TableHead>
                <TableHead className="text-right w-[130px]">Přijato / objednáno</TableHead>
                <TableHead className="w-[110px]">Založeno</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className="hover:bg-accent/40">
                  <TableCell>
                    <Link href={`/gss/orders/${o.id}`} className="font-mono text-sm hover:underline">
                      {o.order_no}
                    </Link>
                  </TableCell>
                  <TableCell>{o.supplier ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{o.lineCount}</TableCell>
                  <TableCell className="text-right font-mono">{o.received} / {o.ordered}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("cs-CZ")}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Žádné objednávky. Návrh vytvoříš tlačítkem výše z položek pod reorder pointem.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
