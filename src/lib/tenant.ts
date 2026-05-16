"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "./supabase-server";

const ACTIVE_TENANT_COOKIE = "gogrou_active_tenant";

export interface UserTenant {
  tenant_id: string;
  prefix: string;
  name: string;
  role: "viewer" | "operator" | "supervisor" | "admin";
}

/** Tenants viditelné aktuálnímu userovi (přes RLS). */
export async function getUserTenants(): Promise<UserTenant[]> {
  const sb = await getServerSupabase();
  const { data, error } = await sb
    .from("gss_user_tenants")
    .select(`role, tenant:gss_tenants!inner(id, prefix, name)`);
  if (error || !data) return [];
  return data.map((r: any) => ({
    tenant_id: r.tenant.id,
    prefix:    r.tenant.prefix,
    name:      r.tenant.name,
    role:      r.role,
  }));
}

/**
 * Aktivní tenant prefix:
 *   1. cookie gogrou_active_tenant
 *   2. první tenant z user_tenants (fallback)
 *   3. NEXT_PUBLIC_DEFAULT_TENANT (jako poslední záchrana)
 */
export async function getActiveTenant(): Promise<string | null> {
  const c = await cookies();
  const fromCookie = c.get(ACTIVE_TENANT_COOKIE)?.value;
  if (fromCookie) return fromCookie;

  const tenants = await getUserTenants();
  if (tenants[0]) return tenants[0].prefix;

  return process.env.NEXT_PUBLIC_DEFAULT_TENANT ?? null;
}

/** Role aktuálního usera v aktivním tenantu (null pokud není member). */
export async function getActiveRole(): Promise<UserTenant["role"] | null> {
  const [tenants, active] = await Promise.all([getUserTenants(), getActiveTenant()]);
  return tenants.find((t) => t.prefix === active)?.role ?? null;
}

/** Je aktuální user admin v libovolném tenantu? (= může editovat GPC catalog) */
export async function isGlobalAdmin(): Promise<boolean> {
  const tenants = await getUserTenants();
  return tenants.some((t) => t.role === "admin");
}

/**
 * Capability matrix podle role:
 *   viewer:     read-only
 *   operator:   scan + transfer (not scrap)
 *   supervisor: + scrap + lifecycle edit
 *   admin:      + GPC catalog edit
 */
export type Capability =
  | "gss.scan" | "gss.transfer" | "gss.scrap" | "gss.edit_lifecycle"
  | "gpc.edit";

const ROLE_CAPS: Record<UserTenant["role"], Set<Capability>> = {
  viewer:     new Set([]),
  operator:   new Set(["gss.scan", "gss.transfer"]),
  supervisor: new Set(["gss.scan", "gss.transfer", "gss.scrap", "gss.edit_lifecycle"]),
  admin:      new Set(["gss.scan", "gss.transfer", "gss.scrap", "gss.edit_lifecycle", "gpc.edit"]),
};

export async function can(cap: Capability): Promise<boolean> {
  const role = await getActiveRole();
  if (!role) return false;
  // gpc.edit funguje napříč tenants (catalog je globální)
  if (cap === "gpc.edit") return isGlobalAdmin();
  return ROLE_CAPS[role].has(cap);
}

/** Server action — přepne aktivní tenant + revaliduj stránky. */
export async function setActiveTenantAction(formData: FormData) {
  const prefix = String(formData.get("prefix") ?? "");
  if (!prefix) return;
  const c = await cookies();
  c.set(ACTIVE_TENANT_COOKIE, prefix, {
    path: "/", httpOnly: false, sameSite: "lax", maxAge: 60 * 60 * 24 * 90,
  });
  revalidatePath("/", "layout");
}
