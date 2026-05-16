/**
 * Server-side low-stock computation. Sdíleno mezi /gss/low-stock page
 * a /api/purchase-proposal exportem.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export interface LowStockItem {
  item_id: string;
  product_id: string;
  gid: string;
  type: string;
  name: string;
  manufacturer: string | null;
  in_stock_qty: number;
  in_production_qty: number;
  in_service_qty: number;
  min_qty: number | null;
  reorder_point: number | null;
  max_qty: number | null;
  suggested_qty: number;
  reason: "out_of_stock" | "below_reorder_point";
}

export async function computeLowStock(
  sb: SupabaseClient<Database>,
  tenantId: string,
): Promise<LowStockItem[]> {
  const { data, error } = await sb
    .from("gss_items")
    .select(`
      id, reorder_point, min_qty, max_qty,
      product:gpc_products!inner(id, gid, type, name, manufacturer),
      pieces:gss_pieces!gss_pieces_item_id_fkey(id, status)
    `)
    .eq("tenant_id", tenantId);
  if (error) throw error;

  type Row = NonNullable<typeof data>[number];
  const out: LowStockItem[] = [];
  for (const it of (data ?? []) as Row[]) {
    const pcs = (it as any).pieces as Array<{ status: string }> | null;
    const inStock = pcs?.filter((p) => p.status === "in_stock").length ?? 0;
    const reorder = it.reorder_point ?? 0;
    if (inStock >= reorder) continue;
    const inProd = pcs?.filter((p) => p.status === "in_production" || p.status === "in_machine").length ?? 0;
    const inSvc  = pcs?.filter((p) => p.status === "in_service").length ?? 0;
    const suggested = Math.max(0, (it.max_qty ?? reorder * 2) - inStock);
    const p = (it as any).product;
    out.push({
      item_id: it.id, product_id: p.id,
      gid: p.gid, type: p.type, name: p.name, manufacturer: p.manufacturer,
      in_stock_qty: inStock, in_production_qty: inProd, in_service_qty: inSvc,
      min_qty: it.min_qty, reorder_point: it.reorder_point, max_qty: it.max_qty,
      suggested_qty: suggested,
      reason: inStock === 0 ? "out_of_stock" : "below_reorder_point",
    });
  }
  out.sort((a, b) => a.in_stock_qty - b.in_stock_qty);
  return out;
}
