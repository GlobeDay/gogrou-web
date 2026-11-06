import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { getActiveTenant } from "@/lib/tenant";

/**
 * GET /api/gss/search?q=…
 * Univerzální hledání (P2 akceptačního reportu): název / výrobce / GID /
 * GTIN / objednací číslo (match_key_value) / DM / QID / externí identifikátory
 * / lokální položky / JSONB parametry GPC (RPC gpc_search_params).
 * Tenant-scoped přes session → RLS.
 */
export async function GET(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const empty = { items: [], catalog: [], pieces: [], external: [] };
  if (q.length < 2) return NextResponse.json(empty);

  const [sb, tenant] = await Promise.all([getServerSupabase(), getActiveTenant()]);
  if (!tenant) return NextResponse.json({ error: "No active tenant" }, { status: 400 });
  const { data: tenantRow } = await sb.from("gss_tenants").select("id").eq("prefix", tenant).maybeSingle();
  if (!tenantRow) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  const tid = tenantRow.id;

  // PostgREST or() odděluje podmínky čárkou — ty z hledaného výrazu vyhodit
  const needle = q.replace(/[,()]/g, " ").replace(/\s+/g, " ").trim();
  if (needle.length < 2) return NextResponse.json(empty);
  const pat = `*${needle}*`;

  const [productsRes, paramsRes, localRes, piecesRes, externalRes] = await Promise.all([
    sb
      .from("gpc_products")
      .select("id, gid, gtin, type, name, manufacturer, match_key_value")
      .or(`name.ilike.${pat},manufacturer.ilike.${pat},gid.ilike.${pat},gtin.ilike.${pat},match_key_value.ilike.${pat}`)
      .limit(25),
    sb.rpc("gpc_search_params", { p_text: needle, p_limit: 25 }),
    sb
      .from("gss_items")
      .select("id, local_name, local_manufacturer, local_type")
      .eq("tenant_id", tid)
      .is("gpc_product_id", null)
      .or(`local_name.ilike.${pat},local_manufacturer.ilike.${pat}`)
      .limit(25),
    sb
      .from("gss_pieces")
      .select("dm_code, qid, status, item:gss_items!inner(id, local_name, product:gpc_products(name, gid))")
      .eq("tenant_id", tid)
      .or(`dm_code.ilike.${pat},qid.ilike.${pat}`)
      .limit(25),
    sb
      .from("gss_item_external_ids")
      .select("system, value, item:gss_items!inner(id, local_name, product:gpc_products(name, gid))")
      .eq("tenant_id", tid)
      .eq("active", true)
      .or(`value.ilike.${pat},system.ilike.${pat}`)
      .limit(25),
  ]);
  const err = productsRes.error ?? paramsRes.error ?? localRes.error ?? piecesRes.error ?? externalRes.error;
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  // Shody z JSONB parametrů přidat k textovým shodám (dedup podle id)
  const textIds = new Set((productsRes.data ?? []).map((p) => p.id));
  const products = [
    ...(productsRes.data ?? []).map((p) => ({ ...p, via_params: false })),
    ...(paramsRes.data ?? [])
      .filter((p) => !textIds.has(p.id))
      .map((p) => ({ ...p, via_params: true })),
  ];
  const productIds = products.map((p) => p.id);
  const { data: adoptedRows } = productIds.length
    ? await sb.from("gss_items").select("id, gpc_product_id").eq("tenant_id", tid).in("gpc_product_id", productIds)
    : { data: [] as Array<{ id: string; gpc_product_id: string | null }> };
  const adopted = new Map((adoptedRows ?? []).map((r) => [r.gpc_product_id, r.id]));

  type PieceJoin = {
    dm_code: string;
    qid: string | null;
    status: string;
    item: { id: string; local_name: string | null; product: { name: string; gid: string } | null };
  };
  type ExtJoin = {
    system: string;
    value: string;
    item: { id: string; local_name: string | null; product: { name: string; gid: string } | null };
  };

  return NextResponse.json({
    items: [
      ...products
        .filter((p) => adopted.has(p.id))
        .map((p) => ({
          item_id: adopted.get(p.id)!,
          gid: p.gid,
          name: p.name,
          manufacturer: p.manufacturer,
          type: p.type,
          is_local: false,
          via_params: p.via_params,
        })),
      ...(localRes.data ?? []).map((it) => ({
        item_id: it.id,
        gid: "LOCAL",
        name: it.local_name ?? "(bez názvu)",
        manufacturer: it.local_manufacturer,
        type: it.local_type ?? "local",
        is_local: true,
      })),
    ],
    catalog: products
      .filter((p) => !adopted.has(p.id))
      .map((p) => ({
        product_id: p.id,
        gid: p.gid,
        name: p.name,
        manufacturer: p.manufacturer,
        type: p.type,
        via_params: p.via_params,
      })),
    pieces: ((piecesRes.data ?? []) as unknown as PieceJoin[]).map((p) => ({
      dm_code: p.dm_code,
      qid: p.qid,
      status: p.status,
      item_id: p.item.id,
      name: p.item.product?.name ?? p.item.local_name ?? "(bez názvu)",
    })),
    external: ((externalRes.data ?? []) as unknown as ExtJoin[]).map((e) => ({
      system: e.system,
      value: e.value,
      item_id: e.item.id,
      name: e.item.product?.name ?? e.item.local_name ?? "(bez názvu)",
    })),
  });
}
