import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { computeNextAction, allowedTransitions, type ScanEvent } from "@/lib/scan-logic";

const ScanBody = z.object({
  tenant_prefix: z.string(),
  dm_code:       z.string().min(1),
  event:         z.enum(["RETURN_FROM_MACHINE","ISSUE_TO_MACHINE","RETURN_FROM_SERVICE","INSPECT"]).optional(),
  context:       z.record(z.string(), z.any()).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let parsed: z.infer<typeof ScanBody>;
  try {
    parsed = ScanBody.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Bad request" }, { status: 400 });
  }

  const sb = await getServerSupabase();

  // Resolve tenant
  const { data: tenant } = await sb.from("gss_tenants").select("id").eq("prefix", parsed.tenant_prefix).maybeSingle();
  if (!tenant) {
    return NextResponse.json({ error: `Tenant '${parsed.tenant_prefix}' nenalezen nebo bez přístupu` }, { status: 404 });
  }

  // Lookup piece + product + location v jednom queryu (PostgREST join)
  const { data: piece, error } = await sb
    .from("gss_pieces")
    .select(`
      id, dm_code, status, lifecycle, item_id, tenant_id, current_location_id, created_at, updated_at,
      location:gss_locations!gss_pieces_current_location_id_fkey(id, code, name),
      item:gss_items!inner(
        id, reorder_point, min_qty, max_qty,
        product:gpc_products!inner(id, gid, type, name, manufacturer, params, external_refs)
      )
    `)
    .eq("tenant_id", tenant.id)
    .eq("dm_code", parsed.dm_code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!piece) {
    return NextResponse.json({ error: `DM '${parsed.dm_code}' u tenant ${parsed.tenant_prefix} nenalezeno` }, { status: 404 });
  }

  const p = piece as any;
  const next_action = computeNextAction(p, parsed.event as ScanEvent | undefined);

  return NextResponse.json({
    piece: {
      id: p.id, dm_code: p.dm_code, status: p.status,
      current_location: p.location ? { code: p.location.code, name: p.location.name } : null,
      lifecycle: p.lifecycle,
    },
    product: p.item?.product
      ? {
          gpc_product_id: p.item.product.id,
          gid:  p.item.product.gid,
          type: p.item.product.type,
          name: p.item.product.name,
          manufacturer: p.item.product.manufacturer,
          params: p.item.product.params,
          external_refs: p.item.product.external_refs,
        }
      : null,
    next_action,
    allowed_transitions: allowedTransitions(p),
  });
}
