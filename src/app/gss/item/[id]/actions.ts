"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { can } from "@/lib/tenant";
import { inferStatusFromMovement } from "@/lib/scan-logic";
import type { Database } from "@/lib/database.types";

export type StockAction = "receive" | "issue" | "sharpen";

export type StockActionResult =
  | { ok: true; action: StockAction; dm_code: string }
  | { ok: false; error: string };

type PieceStatus = Database["public"]["Enums"]["piece_status"];
type MovementType = Database["public"]["Enums"]["movement_type"];

type LocationRow = { id: string; code: string };

type TenantContext = {
  sb: Awaited<ReturnType<typeof getServerSupabase>>;
  user: NonNullable<Awaited<ReturnType<typeof getServerUser>>>;
  itemId: string;
  tenantId: string;
  tenantPrefix: string;
  locations: LocationRow[];
};

type TenantContextResult =
  | { ok: true; ctx: TenantContext }
  | { ok: false; error: string };

const SHARPEN_STATUSES: PieceStatus[] = [
  "in_machine",
  "in_production",
  "in_preset",
  "in_stock",
];

function assertNever(value: never): never {
  throw new Error(`Unhandled stock action: ${String(value)}`);
}

function pickLocation(locations: LocationRow[], ...codes: string[]): LocationRow | null {
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

function receiveDmCode(prefix: string): string {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const rand = crypto.randomUUID().slice(0, 4).toUpperCase();
  return `${prefix}-RCV-${stamp}-${rand}`;
}

async function loadTenantContext(itemId: string): Promise<TenantContextResult> {
  const user = await getServerUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  if (!(await can("gss.transfer"))) {
    return { ok: false, error: "Chybí oprávnění (operator a vyšší)." };
  }

  const sb = await getServerSupabase();
  const { data: item, error: itemErr } = await sb
    .from("gss_items")
    .select("id, tenant_id")
    .eq("id", itemId)
    .maybeSingle();
  if (itemErr) return { ok: false, error: itemErr.message ?? "Načtení karty selhalo." };
  if (!item) return { ok: false, error: "Skladová karta nenalezena." };

  const [{ data: tenant, error: tenantErr }, { data: locations, error: locErr }] = await Promise.all([
    sb.from("gss_tenants").select("prefix").eq("id", item.tenant_id).maybeSingle(),
    sb.from("gss_locations").select("id, code").eq("tenant_id", item.tenant_id),
  ]);
  if (tenantErr) return { ok: false, error: tenantErr.message ?? "Načtení tenantu selhalo." };
  if (!tenant) return { ok: false, error: "Tenant nenalezen." };
  if (locErr) return { ok: false, error: locErr.message ?? "Načtení lokací selhalo." };

  return {
    ok: true,
    ctx: {
      sb,
      user,
      itemId: item.id,
      tenantId: item.tenant_id,
      tenantPrefix: tenant.prefix,
      locations: (locations ?? []) as LocationRow[],
    },
  };
}

async function insertMovement(
  sb: Awaited<ReturnType<typeof getServerSupabase>>,
  input: {
    tenantId: string;
    itemId: string;
    pieceId: string;
    movement: MovementType;
    fromId: string | null;
    toId: string | null;
    createdBy: string | null;
    payload: Record<string, unknown>;
  },
) {
  const { error } = await sb.from("gss_movements").insert({
    tenant_id: input.tenantId,
    item_id: input.itemId,
    piece_id: input.pieceId,
    movement: input.movement,
    from_location_id: input.fromId,
    to_location_id: input.toId,
    quantity: 1,
    payload: input.payload as never,
    created_by: input.createdBy,
  });
  return error;
}

function revalidateItem(itemId: string) {
  revalidatePath(`/gss/item/${itemId}`);
  revalidatePath("/gss/items");
  revalidatePath("/gss/audit");
  revalidatePath("/gss/low-stock");
  revalidatePath("/gina");
}

async function receiveOne(ctx: TenantContext): Promise<StockActionResult> {
  const main = pickLocation(ctx.locations, "MAIN");
  if (!main) return { ok: false, error: "Lokace MAIN v tenantu chybí." };

  const { data: sibling } = await ctx.sb
    .from("gss_pieces")
    .select("lifecycle")
    .eq("item_id", ctx.itemId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const dmCode = receiveDmCode(ctx.tenantPrefix);
  const { data: piece, error: insErr } = await ctx.sb
    .from("gss_pieces")
    .insert({
      tenant_id: ctx.tenantId,
      item_id: ctx.itemId,
      dm_code: dmCode,
      status: "in_stock",
      current_location_id: main.id,
      lifecycle: (sibling?.lifecycle ?? {}) as never,
    })
    .select("id")
    .single();
  if (insErr || !piece) {
    return { ok: false, error: insErr?.message ?? "Příjem se nepodařil." };
  }

  const mvErr = await insertMovement(ctx.sb, {
    tenantId: ctx.tenantId,
    itemId: ctx.itemId,
    pieceId: piece.id,
    movement: "receive",
    fromId: null,
    toId: main.id,
    createdBy: ctx.user.email ?? null,
    payload: { source: "item_qty_actions", action: "receive" },
  });
  if (mvErr) {
    await ctx.sb.from("gss_pieces").delete().eq("id", piece.id);
    return { ok: false, error: mvErr.message };
  }

  revalidateItem(ctx.itemId);
  return { ok: true, action: "receive", dm_code: dmCode };
}

async function moveFifoPiece(
  ctx: TenantContext,
  input: {
    action: Exclude<StockAction, "receive">;
    statuses: PieceStatus[];
    movement: MovementType;
    to: LocationRow;
  },
): Promise<StockActionResult> {
  const { data: piece, error: pieceErr } = await ctx.sb
    .from("gss_pieces")
    .select("id, dm_code, status, current_location_id")
    .eq("item_id", ctx.itemId)
    .in("status", input.statuses)
    .order("updated_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (pieceErr) return { ok: false, error: pieceErr.message };
  if (!piece) {
    return {
      ok: false,
      error: input.action === "issue"
        ? "Na skladě není žádný kus k výdeji."
        : "Není žádný kus k odeslání na broušení.",
    };
  }

  const newStatus = inferStatusFromMovement(input.movement, input.to.code) ?? piece.status;
  const { error: updErr } = await ctx.sb
    .from("gss_pieces")
    .update({ current_location_id: input.to.id, status: newStatus })
    .eq("id", piece.id);
  if (updErr) return { ok: false, error: updErr.message };

  const mvErr = await insertMovement(ctx.sb, {
    tenantId: ctx.tenantId,
    itemId: ctx.itemId,
    pieceId: piece.id,
    movement: input.movement,
    fromId: piece.current_location_id,
    toId: input.to.id,
    createdBy: ctx.user.email ?? null,
    payload: { source: "item_qty_actions", action: input.action },
  });
  if (mvErr) {
    await ctx.sb
      .from("gss_pieces")
      .update({ current_location_id: piece.current_location_id, status: piece.status })
      .eq("id", piece.id);
    return { ok: false, error: mvErr.message };
  }

  revalidateItem(ctx.itemId);
  return { ok: true, action: input.action, dm_code: piece.dm_code };
}

export async function applyStockAction(
  itemId: string,
  action: StockAction,
): Promise<StockActionResult> {
  const loaded = await loadTenantContext(itemId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { ctx } = loaded;

  switch (action) {
    case "receive":
      return receiveOne(ctx);
    case "issue": {
      const machine = pickLocation(ctx.locations, "MACHINE-01", "MACHINE");
      if (!machine) return { ok: false, error: "Lokace MACHINE-01 v tenantu chybí." };
      return moveFifoPiece(ctx, {
        action,
        statuses: ["in_stock"],
        movement: "issue",
        to: machine,
      });
    }
    case "sharpen": {
      const service = pickLocation(ctx.locations, "SERVICE_BIN", "SERVICE");
      if (!service) return { ok: false, error: "Lokace SERVICE_BIN v tenantu chybí." };
      return moveFifoPiece(ctx, {
        action,
        statuses: SHARPEN_STATUSES,
        movement: "service_out",
        to: service,
      });
    }
    default:
      return assertNever(action);
  }
}
