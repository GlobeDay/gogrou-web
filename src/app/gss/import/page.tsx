import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { getActiveTenant, getActiveRole } from "@/lib/tenant";
import { ImportClient } from "./import-client";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/import");

  const role = await getActiveRole();
  if (!role || role === "viewer") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Nemáš oprávnění</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Pro import potřebuješ roli <span className="font-mono">operator</span> a vyšší. Tvoje role: <span className="font-mono">{role ?? "—"}</span>.
        </p>
        <Link href="/gss/items" className="text-sm hover:underline mt-3 inline-block">← Zpět</Link>
      </div>
    );
  }

  const [sb, tenant] = await Promise.all([getServerSupabase(), getActiveTenant()]);
  if (!tenant) return <div className="mx-auto max-w-7xl px-4 py-6">Žádný aktivní tenant.</div>;

  const { data: tenantRow } = await sb.from("gss_tenants").select("id").eq("prefix", tenant).maybeSingle();
  if (!tenantRow) return null;

  // Items + locations pro picker
  const [itemsRes, locsRes] = await Promise.all([
    sb.from("gss_items")
      .select(`id, product:gpc_products!inner(id, gid, type, name)`)
      .eq("tenant_id", tenantRow.id).limit(500),
    sb.from("gss_locations").select("code, name").eq("tenant_id", tenantRow.id).order("code"),
  ]);

  const items = (itemsRes.data ?? []).map((r: any) => ({
    id: r.id, gid: r.product.gid, name: r.product.name, type: r.product.type,
  }));
  const locations = (locsRes.data ?? []) as Array<{ code: string; name: string }>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <Link href="/gss/items" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Zpět na sklad. karty
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Batch DM import</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hromadný import kusů s DM kódy. Vyber sklad. kartu, default lokaci a vlož DM kódy (jeden per řádek).
        </p>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="py-6 text-sm text-muted-foreground">
          Žádné skladové karty v tenant {tenant}. Vytvoř nejdřív sklad. kartu propojením GPC produktu.
        </CardContent></Card>
      ) : (
        <ImportClient items={items} locations={locations} tenantPrefix={tenant} />
      )}
    </div>
  );
}
