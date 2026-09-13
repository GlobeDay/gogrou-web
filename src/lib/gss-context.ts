import { revalidatePath } from "next/cache";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { can, getActiveTenant } from "@/lib/tenant";
import type { Capability } from "@/lib/tenant";

export type LocationRow = { id: string; code: string };

export type GssCtx = {
  sb: Awaited<ReturnType<typeof getServerSupabase>>;
  user: NonNullable<Awaited<ReturnType<typeof getServerUser>>>;
  tenantId: string;
  tenantPrefix: string;
  locations: LocationRow[];
};

export type GssCtxResult = { ok: true; ctx: GssCtx } | { ok: false; error: string };

export function pickLocation(locations: LocationRow[], ...codes: string[]): LocationRow | null {
  for (const code of codes) {
    const exact = locations.find((l) => l.code === code);
    if (exact) return exact;
  }
  for (const code of codes) {
    const prefix = locations.find((l) => l.code.startsWith(code));
    if (prefix) return prefix;
  }
  return null;
}

export async function loadGssContext(cap: Capability = "gss.transfer"): Promise<GssCtxResult> {
  const user = await getServerUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  if (!(await can(cap))) return { ok: false, error: "Chybí oprávnění (operator a vyšší)." };

  const prefix = await getActiveTenant();
  if (!prefix) return { ok: false, error: "Žádný aktivní tenant." };

  const sb = await getServerSupabase();
  const { data: tenant, error: tenantErr } = await sb
    .from("gss_tenants")
    .select("id, prefix")
    .eq("prefix", prefix)
    .maybeSingle();
  if (tenantErr) return { ok: false, error: tenantErr.message ?? "Tenant error" };
  if (!tenant) return { ok: false, error: "Tenant nenalezen." };

  const { data: locations, error: locErr } = await sb
    .from("gss_locations")
    .select("id, code")
    .eq("tenant_id", tenant.id);
  if (locErr) return { ok: false, error: locErr.message ?? "Lokace error" };

  return {
    ok: true,
    ctx: {
      sb,
      user,
      tenantId: tenant.id,
      tenantPrefix: tenant.prefix,
      locations: (locations ?? []) as LocationRow[],
    },
  };
}

export function revalidateGss(itemId?: string) {
  if (itemId) revalidatePath(`/gss/item/${itemId}`);
  revalidatePath("/gss/items");
  revalidatePath("/gss/audit");
  revalidatePath("/gss/low-stock");
  revalidatePath("/gss/terminal");
  revalidatePath("/gss/adopt");
  revalidatePath("/gss/overstock");
  revalidatePath("/gss/shipments");
  revalidatePath("/gss/service");
  revalidatePath("/gina");
}
