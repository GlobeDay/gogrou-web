"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";
import { getClassSchema } from "@/lib/class-schema";

interface ActionResult {
  ok: boolean;
  error?: string;
  productId?: string;
}

/**
 * Sestaví JSONB `params` z FormData podle schema.
 * Klíče v form: `params.{param_code}` — string value, parse podle data_type.
 */
async function buildParams(formData: FormData, type: string) {
  const schema = await getClassSchema(type);
  const params: Record<string, unknown> = {};
  for (const def of schema) {
    const raw = formData.get(`params.${def.param_code}`);
    if (raw == null || raw === "") continue;
    const s = String(raw);
    if (def.data_type === "int")       params[def.param_code] = parseInt(s, 10);
    else if (def.data_type === "float") params[def.param_code] = parseFloat(s.replace(",", "."));
    else if (def.data_type === "bool")  params[def.param_code] = s === "true" || s === "on" || s === "1";
    else                                params[def.param_code] = s;
  }
  return params;
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const gid          = String(formData.get("gid") ?? "").trim();
  const type         = String(formData.get("type") ?? "").trim();
  const name         = String(formData.get("name") ?? "").trim();
  const manufacturer = String(formData.get("manufacturer") ?? "").trim() || null;
  const status       = String(formData.get("status") ?? "active");

  if (!gid || !type || !name) {
    return { ok: false, error: "gid, type a name jsou povinné" };
  }

  const sb = await getServerSupabase();
  const params = await buildParams(formData, type);

  const { data, error } = await sb
    .from("gpc_products")
    .insert({ gid, type, name, manufacturer, status: status as "active" | "phasing_out" | "discontinued", params: params as never })
    .select("id").single();

  if (error) {
    if (error.code === "23505") return { ok: false, error: `GID '${gid}' už existuje` };
    return { ok: false, error: error.message };
  }
  revalidatePath("/gpc");
  redirect(`/gpc/${data.id}`);
}

export async function updateProduct(productId: string, formData: FormData): Promise<ActionResult> {
  const name         = String(formData.get("name") ?? "").trim();
  const manufacturer = String(formData.get("manufacturer") ?? "").trim() || null;
  const status       = String(formData.get("status") ?? "active");
  const type         = String(formData.get("type") ?? "").trim();

  if (!name || !type) return { ok: false, error: "name a type jsou povinné" };

  const sb = await getServerSupabase();
  const params = await buildParams(formData, type);

  const { error } = await sb
    .from("gpc_products")
    .update({ name, manufacturer, status: status as "active" | "phasing_out" | "discontinued", params: params as never })
    .eq("id", productId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/gpc/${productId}`);
  redirect(`/gpc/${productId}`);
}
