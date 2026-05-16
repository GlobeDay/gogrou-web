"use server";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase-server";

export interface ImportRowResult {
  dm_code: string;
  ok: boolean;
  error?: string;
}

export interface ImportResult {
  total: number;
  inserted: number;
  rows: ImportRowResult[];
}

/**
 * Bulk insert DM pieces pro daný item.
 * RLS zajistí, že user může insertovat jen do svých tenantů.
 */
export async function importPieces(input: {
  item_id: string;
  tenant_prefix: string;
  default_status: "new" | "in_stock" | "in_preset";
  default_location_code: string | null;
  dm_codes: string[];          // jedno DM per řádek, už deduplicated + trimmed
  lifecycle_template?: Record<string, unknown>;
}): Promise<ImportResult> {
  const sb = await getServerSupabase();

  const { data: tenant } = await sb.from("gss_tenants").select("id").eq("prefix", input.tenant_prefix).maybeSingle();
  if (!tenant) {
    return { total: input.dm_codes.length, inserted: 0,
      rows: input.dm_codes.map((dm) => ({ dm_code: dm, ok: false, error: "Tenant not found / no access" })) };
  }

  let locationId: string | null = null;
  if (input.default_location_code) {
    const { data: loc } = await sb.from("gss_locations").select("id")
      .eq("tenant_id", tenant.id).eq("code", input.default_location_code).maybeSingle();
    locationId = loc?.id ?? null;
  }

  // Připrav bulk rows
  const toInsert = input.dm_codes.map((dm) => ({
    tenant_id:           tenant.id,
    item_id:             input.item_id,
    dm_code:             dm,
    status:              input.default_status,
    current_location_id: locationId,
    lifecycle:           (input.lifecycle_template ?? {}) as never,
  }));

  // Pokus o bulk insert; pokud selže, fallback per-row, ať můžeme reportovat per-DM failures
  const bulk = await sb.from("gss_pieces").insert(toInsert).select("dm_code");
  if (!bulk.error) {
    revalidatePath("/gss/items");
    return {
      total: input.dm_codes.length,
      inserted: bulk.data?.length ?? input.dm_codes.length,
      rows: input.dm_codes.map((dm) => ({ dm_code: dm, ok: true })),
    };
  }

  // Per-row fallback (typicky kvůli unique conflict na (tenant_id, dm_code))
  const rows: ImportRowResult[] = [];
  let ok = 0;
  for (const r of toInsert) {
    const { error } = await sb.from("gss_pieces").insert(r);
    if (error) {
      rows.push({
        dm_code: r.dm_code, ok: false,
        error: error.code === "23505" ? "DM už existuje" : (error.message ?? "Insert failed"),
      });
    } else {
      rows.push({ dm_code: r.dm_code, ok: true });
      ok++;
    }
  }
  revalidatePath("/gss/items");
  return { total: input.dm_codes.length, inserted: ok, rows };
}
