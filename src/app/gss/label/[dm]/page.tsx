import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { getActiveTenant } from "@/lib/tenant";
import { asLifecycle } from "@/lib/gss-lock";
import { LabelPrint } from "./label-print";

export const dynamic = "force-dynamic";

type Params = Promise<{ dm: string }>;

export default async function LabelPage({ params }: { params: Params }) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const { dm } = await params;
  const code = decodeURIComponent(dm);
  const [sb, prefix] = await Promise.all([getServerSupabase(), getActiveTenant()]);
  if (!prefix) notFound();
  const { data: tenant } = await sb.from("gss_tenants").select("id").eq("prefix", prefix).maybeSingle();
  if (!tenant) notFound();
  const { data: piece } = await sb
    .from("gss_pieces")
    .select("dm_code, lifecycle, item_id")
    .eq("tenant_id", tenant.id)
    .eq("dm_code", code)
    .maybeSingle();
  if (!piece) notFound();
  const { data: item } = await sb.from("gss_items").select("gpc_product_id").eq("id", piece.item_id).maybeSingle();
  if (!item) notFound();
  const { data: product } = await sb
    .from("gpc_products")
    .select("name, manufacturer, gid")
    .eq("id", item.gpc_product_id)
    .maybeSingle();
  if (!product) notFound();
  const life = asLifecycle(piece.lifecycle);

  return (
    <div className="mx-auto max-w-md px-4 py-6 space-y-4">
      <Link href="/gss/service" className="text-sm text-muted-foreground hover:underline print:hidden">← Servis</Link>
      <LabelPrint
        dm={piece.dm_code}
        qid={life.qid ?? "—"}
        name={product.name}
        manufacturer={product.manufacturer ?? "—"}
        gid={product.gid}
        diameter={life.sharpening?.diameter_mm}
        date={life.sharpening?.date}
        marked={Boolean(life.marked)}
      />
    </div>
  );
}
