"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase-server";
import { can, getActiveTenant } from "@/lib/tenant";
import { inferStatusFromMovement } from "@/lib/scan-logic";
import { loadGssContext, pickLocation, revalidateGss, type GssCtx } from "@/lib/gss-context";
import {
  asLifecycle,
  inheritLifecycle,
  mergeLifecycle,
  newQid,
  newReleaseCode,
  type DocumentType,
  type OverstockOffer,
  type PieceLifecycle,
  type ReceiptSource,
  type ReturnDecision,
  type ServiceShipment,
  type ShipmentStatus,
} from "@/lib/gss-lock";
import type { Database } from "@/lib/database.types";

export type OpsResult =
  | { ok: true; message: string; id?: string; dm_code?: string }
  | { ok: false; error: string };

type MovementType = Database["public"]["Enums"]["movement_type"];
type PieceStatus = Database["public"]["Enums"]["piece_status"];
type Json = Database["public"]["Tables"]["gss_movements"]["Insert"]["payload"];

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}

async function insertMovement(
  ctx: GssCtx,
  input: {
    movement: MovementType;
    itemId?: string | null;
    pieceId?: string | null;
    fromId?: string | null;
    toId?: string | null;
    quantity?: number;
    payload: Record<string, unknown>;
  },
) {
  return ctx.sb.from("gss_movements").insert({
    tenant_id: ctx.tenantId,
    movement: input.movement,
    item_id: input.itemId ?? null,
    piece_id: input.pieceId ?? null,
    from_location_id: input.fromId ?? null,
    to_location_id: input.toId ?? null,
    quantity: input.quantity ?? 1,
    payload: input.payload as Json,
    created_by: ctx.user.email ?? null,
  });
}

async function loadItem(ctx: GssCtx, itemId: string) {
  return ctx.sb
    .from("gss_items")
    .select("id, tracking_mode, qty_on_hand, max_qty")
    .eq("id", itemId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
}

async function loadPiece(ctx: { sb: Awaited<ReturnType<typeof getServerSupabase>>; tenantId: string }, dmCode: string) {
  return ctx.sb
    .from("gss_pieces")
    .select("id, dm_code, item_id, status, current_location_id, lifecycle")
    .eq("tenant_id", ctx.tenantId)
    .eq("dm_code", dmCode)
    .maybeSingle();
}

export async function adoptGpcProduct(productId: string): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  const { ctx } = loaded;

  const { data: product, error: pErr } = await ctx.sb
    .from("gpc_products")
    .select("id, gid, name")
    .eq("id", productId)
    .maybeSingle();
  if (pErr) return { ok: false, error: pErr.message };
  if (!product) return { ok: false, error: "Produkt v GPC nenalezen." };

  // Non-DM evidence je výchozí režim; DM/QID je nadstavba (kap. 3.5 acceptance reportu)
  const { data: item, error } = await ctx.sb
    .from("gss_items")
    .insert({ tenant_id: ctx.tenantId, gpc_product_id: product.id, tracking_mode: "quantity" })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Položka už je na skladě tohoto tenanta." };
    return { ok: false, error: error.message };
  }

  await insertMovement(ctx, {
    movement: "adjust",
    itemId: item.id,
    payload: { source: "lock_parity", kind: "gpc_adopt", gid: product.gid },
  });
  revalidateGss(item.id);
  revalidatePath(`/gpc/${productId}`);
  return { ok: true, message: `Převzato do skladu: ${product.name}`, id: item.id };
}

export async function createLocalItem(input: {
  name: string;
  manufacturer: string;
  type?: string;
  min_qty: number | null;
  max_qty: number | null;
  reorder_point: number | null;
  notes: string;
}): Promise<OpsResult> {
  // Lokální položka žije jen v GSS, GPC se nedotýká (kap. 3.5) — stačí supervisor
  const loaded = await loadGssContext("gss.edit_lifecycle");
  if (!loaded.ok) return loaded;
  const { ctx } = loaded;
  const name = input.name.trim();
  const manufacturer = input.manufacturer.trim();
  if (!name || !manufacturer) return { ok: false, error: "Název a výrobce jsou povinné." };

  const { data: item, error } = await ctx.sb
    .from("gss_items")
    .insert({
      tenant_id: ctx.tenantId,
      gpc_product_id: null,
      local_name: name,
      local_manufacturer: manufacturer,
      local_type: input.type?.trim() || null,
      tracking_mode: "quantity",
      min_qty: input.min_qty,
      max_qty: input.max_qty,
      reorder_point: input.reorder_point,
      notes: input.notes,
    })
    .select("id")
    .single();
  if (error || !item) return { ok: false, error: error?.message ?? "Skladová karta se nevytvořila." };

  await insertMovement(ctx, {
    movement: "adjust",
    itemId: item.id,
    payload: { source: "lock_parity", kind: "local_item_created", name, manufacturer },
  });
  revalidateGss(item.id);
  return { ok: true, message: `Lokální položka „${name}“ vytvořena (jen v GSS).`, id: item.id };
}

export async function requestGpcValidation(itemId: string, message: string): Promise<OpsResult> {
  const loaded = await loadGssContext("gss.edit_lifecycle");
  if (!loaded.ok) return loaded;
  const { ctx } = loaded;
  const { data: item, error } = await ctx.sb
    .from("gss_items")
    .select("id, gpc_product_id, local_name")
    .eq("id", itemId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!item) return { ok: false, error: "Položka nenalezena." };
  if (item.gpc_product_id) {
    return { ok: false, error: "Položka už má GPC kartu — validace není potřeba." };
  }

  const { data: pending } = await ctx.sb
    .from("gss_gpc_validation_requests")
    .select("id")
    .eq("item_id", itemId)
    .eq("status", "pending")
    .maybeSingle();
  if (pending) return { ok: false, error: "Žádost o validaci už čeká na vyřízení." };

  const { error: insErr } = await ctx.sb.from("gss_gpc_validation_requests").insert({
    tenant_id: ctx.tenantId,
    item_id: itemId,
    message: message.trim() || null,
    created_by: ctx.user.email ?? null,
  });
  if (insErr) return { ok: false, error: insErr.message };
  revalidateGss(itemId);
  return { ok: true, message: "Žádost o zařazení do GPC odeslána." };
}

export async function updateItemPolicy(input: {
  itemId: string;
  min_qty: number | null;
  max_qty: number | null;
  reorder_point: number | null;
  notes: string;
  pack_size?: number | null;
  supplier_primary?: string | null;
  supplier_secondary?: string | null;
  tracking_mode?: Database["public"]["Enums"]["item_tracking_mode"];
}): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  const { error } = await loaded.ctx.sb
    .from("gss_items")
    .update({
      min_qty: input.min_qty,
      max_qty: input.max_qty,
      reorder_point: input.reorder_point,
      notes: input.notes,
      ...(input.pack_size !== undefined ? { pack_size: input.pack_size } : {}),
      ...(input.supplier_primary !== undefined ? { supplier_primary: input.supplier_primary } : {}),
      ...(input.supplier_secondary !== undefined ? { supplier_secondary: input.supplier_secondary } : {}),
      ...(input.tracking_mode !== undefined ? { tracking_mode: input.tracking_mode } : {}),
    })
    .eq("id", input.itemId)
    .eq("tenant_id", loaded.ctx.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidateGss(input.itemId);
  return { ok: true, message: "Nastavení položky uloženo." };
}

export async function receiveBatch(input: {
  itemId: string;
  qty: number;
  source: ReceiptSource;
  document_type: DocumentType;
  doc_no: string;
}): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  const { ctx } = loaded;
  const qty = Math.floor(input.qty);
  if (!Number.isFinite(qty) || qty < 1 || qty > 50) {
    return { ok: false, error: "Množství musí být 1–50." };
  }
  const main = pickLocation(ctx.locations, "MAIN");
  if (!main) return { ok: false, error: "Lokace MAIN chybí." };

  const { data: item, error: itemErr } = await loadItem(ctx, input.itemId);
  if (itemErr) return { ok: false, error: itemErr.message };
  if (!item) return { ok: false, error: "Položka nenalezena." };

  // Množstevní (non-DM) režim: žádné kusy, jen qty_on_hand + jeden pohyb s quantity
  if (item.tracking_mode === "quantity") {
    const newQty = (item.qty_on_hand ?? 0) + qty;
    const { error: updErr } = await ctx.sb
      .from("gss_items")
      .update({ qty_on_hand: newQty })
      .eq("id", item.id)
      .eq("tenant_id", ctx.tenantId);
    if (updErr) return { ok: false, error: updErr.message };
    const mv = await insertMovement(ctx, {
      movement: "receive",
      itemId: item.id,
      toId: main.id,
      quantity: qty,
      payload: {
        source: "lock_parity",
        kind: "receive",
        mode: "quantity",
        receipt_source: input.source,
        document_type: input.document_type,
        doc_no: input.doc_no,
      },
    });
    if (mv.error) {
      await ctx.sb
        .from("gss_items")
        .update({ qty_on_hand: item.qty_on_hand ?? 0 })
        .eq("id", item.id)
        .eq("tenant_id", ctx.tenantId);
      return { ok: false, error: mv.error.message };
    }
    revalidateGss(item.id);
    return { ok: true, message: `Příjem +${qty} (bez DM), skladem ${newQty}.` };
  }

  const { data: sibling } = await ctx.sb
    .from("gss_pieces")
    .select("lifecycle")
    .eq("item_id", input.itemId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const created: string[] = [];
  for (let i = 0; i < qty; i++) {
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const dm = `${ctx.tenantPrefix}-RCV-${stamp}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    // QID vzniká automaticky spolu s DM kusem (AT-009)
    const qid = newQid(ctx.tenantPrefix);
    const lifecycle = { ...inheritLifecycle(sibling?.lifecycle), condition: "new" as const, qid };
    const { data: piece, error: insErr } = await ctx.sb
      .from("gss_pieces")
      .insert({
        tenant_id: ctx.tenantId,
        item_id: input.itemId,
        dm_code: dm,
        status: "in_stock",
        condition: "new",
        qid,
        current_location_id: main.id,
        lifecycle: lifecycle as never,
      })
      .select("id")
      .single();
    if (insErr || !piece) return { ok: false, error: insErr?.message ?? "Příjem kusu selhal." };
    const mv = await insertMovement(ctx, {
      movement: "receive",
      itemId: input.itemId,
      pieceId: piece.id,
      toId: main.id,
      payload: {
        source: "lock_parity",
        kind: "receive",
        receipt_source: input.source,
        document_type: input.document_type,
        doc_no: input.doc_no,
      },
    });
    if (mv.error) {
      await ctx.sb.from("gss_pieces").delete().eq("id", piece.id);
      return { ok: false, error: mv.error.message };
    }
    created.push(dm);
  }
  revalidateGss(input.itemId);
  return { ok: true, message: `Příjem +${created.length}`, dm_code: created[0] };
}

export type IssueDetails = { machine?: string; order?: string; cost_center?: string };

function issueDetailsPayload(details?: IssueDetails): Record<string, unknown> {
  return {
    ...(details?.machine?.trim() ? { machine: details.machine.trim() } : {}),
    ...(details?.order?.trim() ? { order: details.order.trim() } : {}),
    ...(details?.cost_center?.trim() ? { cost_center: details.cost_center.trim() } : {}),
  };
}

export async function issueQuantity(
  itemId: string,
  qty: number,
  details?: IssueDetails,
): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  const { ctx } = loaded;
  const n = Math.floor(qty);
  if (!Number.isFinite(n) || n < 1) return { ok: false, error: "Množství musí být aspoň 1." };
  const main = pickLocation(ctx.locations, "MAIN");
  const machine = pickLocation(ctx.locations, "MACHINE-01", "MACHINE");
  if (!machine) return { ok: false, error: "Lokace MACHINE-01 chybí." };

  const { data: item, error: itemErr } = await loadItem(ctx, itemId);
  if (itemErr) return { ok: false, error: itemErr.message };
  if (!item) return { ok: false, error: "Položka nenalezena." };
  if (item.tracking_mode !== "quantity") {
    return { ok: false, error: "Položka je v DM režimu — vydávej konkrétní kusy." };
  }
  const onHand = item.qty_on_hand ?? 0;
  if (onHand < n) return { ok: false, error: `Skladem jen ${onHand} ks.` };

  const { error: updErr } = await ctx.sb
    .from("gss_items")
    .update({ qty_on_hand: onHand - n })
    .eq("id", item.id)
    .eq("tenant_id", ctx.tenantId);
  if (updErr) return { ok: false, error: updErr.message };
  const mv = await insertMovement(ctx, {
    movement: "issue",
    itemId: item.id,
    fromId: main?.id ?? null,
    toId: machine.id,
    quantity: n,
    payload: {
      source: "lock_parity",
      kind: "issue_to_production",
      mode: "quantity",
      ...issueDetailsPayload(details),
    },
  });
  if (mv.error) {
    await ctx.sb
      .from("gss_items")
      .update({ qty_on_hand: onHand })
      .eq("id", item.id)
      .eq("tenant_id", ctx.tenantId);
    return { ok: false, error: mv.error.message };
  }
  revalidateGss(item.id);
  return { ok: true, message: `Výdej ${n} ks do výroby, skladem ${onHand - n}.` };
}

export async function issuePieces(
  itemId: string,
  dmCodes: string[],
  details?: IssueDetails,
): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  const { ctx } = loaded;
  const machine = pickLocation(ctx.locations, "MACHINE-01", "MACHINE");
  if (!machine) return { ok: false, error: "Lokace MACHINE-01 chybí." };
  if (dmCodes.length === 0) return { ok: false, error: "Vyber aspoň jeden kus." };

  for (const dm of dmCodes) {
    const { data: piece, error } = await loadPiece(ctx, dm);
    if (error) return { ok: false, error: error.message };
    if (!piece || piece.item_id !== itemId) return { ok: false, error: `Kus ${dm} nenalezen.` };
    const life = asLifecycle(piece.lifecycle);
    if (life.reservation?.active) {
      return { ok: false, error: `${dm} je rezervovaný — použij výdej rezervace.` };
    }
    if (life.blocked) return { ok: false, error: `${dm} je zablokovaný.` };
    if (piece.status !== "in_stock") return { ok: false, error: `${dm} není na skladě.` };

    const { error: updErr } = await ctx.sb
      .from("gss_pieces")
      .update({ current_location_id: machine.id, status: "in_machine" })
      .eq("id", piece.id);
    if (updErr) return { ok: false, error: updErr.message };
    const mv = await insertMovement(ctx, {
      movement: "issue",
      itemId,
      pieceId: piece.id,
      fromId: piece.current_location_id,
      toId: machine.id,
      payload: { source: "lock_parity", kind: "issue_to_production", ...issueDetailsPayload(details) },
    });
    if (mv.error) return { ok: false, error: mv.error.message };
  }
  revalidateGss(itemId);
  return { ok: true, message: `Výdej ${dmCodes.length} ks do výroby.` };
}

export async function returnFromProduction(
  dmCode: string,
  decision: ReturnDecision,
  note: string,
): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  const { ctx } = loaded;
  const { data: piece, error } = await loadPiece(ctx, dmCode);
  if (error) return { ok: false, error: error.message };
  if (!piece) return { ok: false, error: `DM ${dmCode} nenalezeno.` };

  const main = pickLocation(ctx.locations, "MAIN");
  const service = pickLocation(ctx.locations, "SERVICE_BIN", "SERVICE");
  if (!main) return { ok: false, error: "Lokace MAIN chybí." };

  let movement: MovementType = "transfer";
  let to = main;
  let status: PieceStatus = "in_stock";
  let lifePatch: PieceLifecycle = { condition: "used", blocked: false };

  switch (decision) {
    case "return_used":
      movement = "transfer";
      to = main;
      status = "in_stock";
      lifePatch = { condition: "used", blocked: false };
      break;
    case "send_sharpening":
      if (!service) return { ok: false, error: "Lokace SERVICE_BIN chybí." };
      movement = "service_out";
      to = service;
      status = "in_service";
      break;
    case "scrap_carbide":
      movement = "scrap";
      status = "scrapped";
      break;
    case "redirect_instruction":
      movement = "transfer";
      to = main;
      status = "in_stock";
      lifePatch = { condition: "used", blocked: false };
      break;
    case "temporary_block":
      movement = "adjust";
      to = { id: piece.current_location_id ?? main.id, code: "HOLD" };
      status = piece.status;
      lifePatch = { blocked: true };
      break;
    default:
      return assertNever(decision);
  }

  const toId = decision === "scrap_carbide" ? null : to.id;
  const newStatus = inferStatusFromMovement(movement, decision === "scrap_carbide" ? null : to.code) ?? status;
  const lifecycle = mergeLifecycle(piece.lifecycle, lifePatch);

  const { error: updErr } = await ctx.sb
    .from("gss_pieces")
    .update({
      current_location_id: toId,
      status: newStatus,
      lifecycle: lifecycle as never,
      ...(lifePatch.condition ? { condition: lifePatch.condition } : {}),
    })
    .eq("id", piece.id);
  if (updErr) return { ok: false, error: updErr.message };

  const mv = await insertMovement(ctx, {
    movement,
    itemId: piece.item_id,
    pieceId: piece.id,
    fromId: piece.current_location_id,
    toId,
    payload: { source: "lock_parity", kind: "production_return", decision, note },
  });
  if (mv.error) return { ok: false, error: mv.error.message };
  revalidateGss(piece.item_id);
  return { ok: true, message: `Návrat ${dmCode} uložen.`, dm_code: dmCode };
}

export async function reservePiece(input: {
  dmCode: string;
  order: string;
  reason: string;
  machine: string;
  until: string;
}): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  const { ctx } = loaded;
  const { data: piece, error } = await loadPiece(ctx, input.dmCode);
  if (error) return { ok: false, error: error.message };
  if (!piece) return { ok: false, error: "Kus nenalezen." };
  if (piece.status !== "in_stock") return { ok: false, error: "Rezervovat lze jen kus na skladě." };
  const life = asLifecycle(piece.lifecycle);
  if (life.reservation?.active) return { ok: false, error: "Kus už je rezervovaný." };

  const release = newReleaseCode();
  const lifecycle = mergeLifecycle(piece.lifecycle, {
    reservation: {
      active: true,
      order: input.order,
      reason: input.reason,
      machine: input.machine,
      until: input.until,
      release_code: release,
    },
  });
  const { error: updErr } = await ctx.sb
    .from("gss_pieces")
    .update({ lifecycle: lifecycle as never })
    .eq("id", piece.id);
  if (updErr) return { ok: false, error: updErr.message };
  await insertMovement(ctx, {
    movement: "adjust",
    itemId: piece.item_id,
    pieceId: piece.id,
    payload: { source: "lock_parity", kind: "reservation_created", release_code: release },
  });
  revalidateGss(piece.item_id);
  return { ok: true, message: `Rezervace ${input.dmCode} · kód ${release}`, dm_code: input.dmCode };
}

export async function issueReserved(dmCode: string, releaseCode: string): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  const { ctx } = loaded;
  const { data: piece, error } = await loadPiece(ctx, dmCode);
  if (error) return { ok: false, error: error.message };
  if (!piece) return { ok: false, error: "Kus nenalezen." };
  const life = asLifecycle(piece.lifecycle);
  if (!life.reservation?.active) return { ok: false, error: "Kus není rezervovaný." };
  if (life.reservation.release_code !== releaseCode.trim()) {
    return { ok: false, error: "Release kód nesedí." };
  }
  const machine = pickLocation(ctx.locations, life.reservation.machine || "MACHINE-01", "MACHINE");
  if (!machine) return { ok: false, error: "Cílový stroj nenalezen." };

  const lifecycle = mergeLifecycle(piece.lifecycle, {
    reservation: { ...life.reservation, active: false },
  });
  const { error: updErr } = await ctx.sb
    .from("gss_pieces")
    .update({ status: "in_machine", current_location_id: machine.id, lifecycle: lifecycle as never })
    .eq("id", piece.id);
  if (updErr) return { ok: false, error: updErr.message };
  await insertMovement(ctx, {
    movement: "issue",
    itemId: piece.item_id,
    pieceId: piece.id,
    fromId: piece.current_location_id,
    toId: machine.id,
    payload: { source: "lock_parity", kind: "reserved_issue", release_code: releaseCode },
  });
  revalidateGss(piece.item_id);
  return { ok: true, message: `Rezervovaný kus ${dmCode} vydán.`, dm_code: dmCode };
}

export async function assignQid(dmCode: string, markPhysical: boolean): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  const { ctx } = loaded;
  const { data: piece, error } = await loadPiece(ctx, dmCode);
  if (error) return { ok: false, error: error.message };
  if (!piece) return { ok: false, error: "Kus nenalezen." };
  const life = asLifecycle(piece.lifecycle);
  const qid = life.qid || newQid(ctx.tenantPrefix);
  const lifecycle = mergeLifecycle(piece.lifecycle, { qid, marked: markPhysical || life.marked });
  const { error: updErr } = await ctx.sb
    .from("gss_pieces")
    .update({ lifecycle: lifecycle as never, qid })
    .eq("id", piece.id);
  if (updErr) return { ok: false, error: updErr.message };
  await insertMovement(ctx, {
    movement: "adjust",
    itemId: piece.item_id,
    pieceId: piece.id,
    payload: { source: "lock_parity", kind: "qid", qid, marked: lifecycle.marked },
  });
  revalidateGss(piece.item_id);
  return { ok: true, message: `QID ${qid}`, dm_code: dmCode, id: qid };
}

export async function saveServiceParams(input: {
  dmCode: string;
  diameter_mm: string;
  l1_mm: string;
  l2_mm: string;
  performer: string;
  date: string;
  notes: string;
}): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  const { ctx } = loaded;
  const { data: piece, error } = await loadPiece(ctx, input.dmCode);
  if (error) return { ok: false, error: error.message };
  if (!piece) return { ok: false, error: "Kus nenalezen." };
  const prevCycles = Number(asLifecycle(piece.lifecycle).sharpening?.cycles_done ?? 0);
  const lifecycle = mergeLifecycle(piece.lifecycle, {
    sharpening: {
      diameter_mm: Number(input.diameter_mm) || undefined,
      l1_mm: Number(input.l1_mm) || undefined,
      l2_mm: Number(input.l2_mm) || undefined,
      performer: input.performer,
      date: input.date,
      notes: input.notes,
    },
  });
  const { error: updErr } = await ctx.sb
    .from("gss_pieces")
    .update({ lifecycle: lifecycle as never })
    .eq("id", piece.id);
  if (updErr) return { ok: false, error: updErr.message };

  // Historie D/L1/L2 per servisní cyklus (AT-020) — lifecycle drží jen poslední stav
  const { error: evErr } = await ctx.sb.from("gss_piece_service_events").insert({
    tenant_id: ctx.tenantId,
    piece_id: piece.id,
    cycle_no: prevCycles + 1,
    diameter_mm: Number(input.diameter_mm) || null,
    l1_mm: Number(input.l1_mm) || null,
    l2_mm: Number(input.l2_mm) || null,
    performer: input.performer || null,
    event_date: input.date || null,
    notes: input.notes || null,
    created_by: ctx.user.email ?? null,
  });
  if (evErr) return { ok: false, error: evErr.message };

  await insertMovement(ctx, {
    movement: "adjust",
    itemId: piece.item_id,
    pieceId: piece.id,
    payload: { source: "lock_parity", kind: "dm_service_updated" },
  });
  revalidateGss(piece.item_id);
  return { ok: true, message: "Servisní parametry uloženy. Připrav štítek.", dm_code: input.dmCode };
}

export async function sendToSharpening(dmCode: string): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  const { ctx } = loaded;
  const { data: piece, error } = await loadPiece(ctx, dmCode);
  if (error) return { ok: false, error: error.message };
  if (!piece) return { ok: false, error: "Kus nenalezen." };
  const service = pickLocation(ctx.locations, "SERVICE_BIN", "SERVICE");
  if (!service) return { ok: false, error: "Lokace SERVICE_BIN chybí." };
  const { error: updErr } = await ctx.sb
    .from("gss_pieces")
    .update({ status: "in_service", current_location_id: service.id })
    .eq("id", piece.id);
  if (updErr) return { ok: false, error: updErr.message };
  const mv = await insertMovement(ctx, {
    movement: "service_out",
    itemId: piece.item_id,
    pieceId: piece.id,
    fromId: piece.current_location_id,
    toId: service.id,
    payload: { source: "lock_parity", kind: "send_to_sharpening" },
  });
  if (mv.error) return { ok: false, error: mv.error.message };
  revalidateGss(piece.item_id);
  return { ok: true, message: `${dmCode} odeslán na broušení.`, dm_code: dmCode };
}

export async function receiveFromSharpening(dmCode: string): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  const { ctx } = loaded;
  const { data: piece, error } = await loadPiece(ctx, dmCode);
  if (error) return { ok: false, error: error.message };
  if (!piece) return { ok: false, error: "Kus nenalezen." };
  const main = pickLocation(ctx.locations, "MAIN");
  if (!main) return { ok: false, error: "Lokace MAIN chybí." };
  const life = asLifecycle(piece.lifecycle);
  const cycles = Number(life.sharpening?.cycles_done ?? 0) + 1;
  const lifecycle = mergeLifecycle(piece.lifecycle, {
    condition: "resharpened_new",
    sharpening: { ...life.sharpening, cycles_done: cycles },
  });
  const { error: updErr } = await ctx.sb
    .from("gss_pieces")
    .update({
      status: "in_stock",
      current_location_id: main.id,
      condition: "resharpened_new",
      lifecycle: lifecycle as never,
    })
    .eq("id", piece.id);
  if (updErr) return { ok: false, error: updErr.message };
  await insertMovement(ctx, {
    movement: "service_in",
    itemId: piece.item_id,
    pieceId: piece.id,
    fromId: piece.current_location_id,
    toId: main.id,
    payload: { source: "lock_parity", kind: "receive_from_sharpening" },
  });
  revalidateGss(piece.item_id);
  return { ok: true, message: `${dmCode} přijat z broušení jako Nový přebroušený.`, dm_code: dmCode };
}

export async function saveOverstockOffer(itemId: string, qty: number, price: number): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  if (qty <= 0 || price < 0) return { ok: false, error: "Množství a cena musí být kladné." };
  const offer: OverstockOffer = {
    item_id: itemId,
    qty,
    price,
    updated_at: new Date().toISOString(),
  };
  const mv = await insertMovement(loaded.ctx, {
    movement: "adjust",
    itemId,
    payload: { source: "lock_parity", kind: "overstock_offer", offer },
  });
  if (mv.error) return { ok: false, error: mv.error.message };
  revalidateGss(itemId);
  return { ok: true, message: "Nadnormativní nabídka uložena." };
}

export async function saveShipment(input: {
  id?: string;
  number: string;
  status: ShipmentStatus;
  customer: string;
  order: string;
  dm_codes: string;
}): Promise<OpsResult> {
  const loaded = await loadGssContext();
  if (!loaded.ok) return loaded;
  const shipment: ServiceShipment = {
    id: input.id || crypto.randomUUID(),
    number: input.number.trim() || `DL-BR-${loaded.ctx.tenantPrefix}-${Date.now().toString().slice(-4)}`,
    status: input.status,
    customer: input.customer.trim(),
    order: input.order.trim(),
    partner: "M-technologies",
    items: input.dm_codes.split(/[\s,]+/).filter(Boolean).map((dm) => ({ dm_code: dm })),
    updated_at: new Date().toISOString(),
  };
  const mv = await insertMovement(loaded.ctx, {
    movement: "adjust",
    payload: { source: "lock_parity", kind: "service_shipment", shipment },
  });
  if (mv.error) return { ok: false, error: mv.error.message };
  revalidateGss();
  revalidatePath("/gss/shipments");
  return { ok: true, message: `Zásilka ${shipment.number} uložena.`, id: shipment.id };
}

export async function tryCreateTenant(input: {
  name: string;
  prefix: string;
}): Promise<OpsResult> {
  if (!(await can("gpc.edit"))) return { ok: false, error: "Jen global admin." };
  const sb = await getServerSupabase();
  const prefix = input.prefix.trim().toUpperCase();
  const name = input.name.trim();
  if (!prefix || !name) return { ok: false, error: "Název a prefix jsou povinné." };
  const { data, error } = await sb.from("gss_tenants").insert({ prefix, name }).select("id").single();
  if (error) {
    return {
      ok: false,
      error: `${error.message} Tenant insert je v RLS jen přes SQL (viz DATABASE.md §11.1).`,
    };
  }
  revalidatePath("/admin/organizations");
  return { ok: true, message: `Tenant ${prefix} vytvořen.`, id: data.id };
}

export async function listPieces(opts?: { itemId?: string; statuses?: PieceStatus[] }) {
  const loaded = await loadGssContext("gss.scan");
  if (!loaded.ok) return [];
  let q = loaded.ctx.sb
    .from("gss_pieces")
    .select("id, dm_code, item_id, status, lifecycle, updated_at, current_location_id")
    .eq("tenant_id", loaded.ctx.tenantId)
    .order("updated_at", { ascending: false })
    .limit(400);
  if (opts?.itemId) q = q.eq("item_id", opts.itemId);
  if (opts?.statuses?.length) q = q.in("status", opts.statuses);
  const { data } = await q;
  const locIds = [...new Set((data ?? []).map((p) => p.current_location_id).filter(Boolean))] as string[];
  const locMap = new Map<string, string>();
  if (locIds.length > 0) {
    const { data: locs } = await loaded.ctx.sb.from("gss_locations").select("id, code").in("id", locIds);
    for (const loc of locs ?? []) locMap.set(loc.id, loc.code);
  }
  return (data ?? []).map((p) => ({
    id: p.id,
    dm_code: p.dm_code,
    item_id: p.item_id,
    status: p.status,
    lifecycle: asLifecycle(p.lifecycle),
    location: p.current_location_id ? locMap.get(p.current_location_id) ?? null : null,
    updated_at: p.updated_at,
  }));
}

export async function listPayloadRecords<T>(kind: string): Promise<T[]> {
  const loaded = await loadGssContext("gss.scan");
  if (!loaded.ok) return [];
  const { data } = await loaded.ctx.sb
    .from("gss_movements")
    .select("payload, occurred_at")
    .eq("tenant_id", loaded.ctx.tenantId)
    .contains("payload", { kind })
    .order("occurred_at", { ascending: false })
    .limit(200);
  return (data ?? [])
    .map((row) => row.payload as Record<string, unknown>)
    .map((payload) => (payload.offer ?? payload.shipment ?? payload) as T);
}

export async function listWarehouseCards() {
  const prefix = await getActiveTenant();
  const sb = await getServerSupabase();
  if (!prefix) return [];
  const { data: tenant } = await sb.from("gss_tenants").select("id").eq("prefix", prefix).maybeSingle();
  if (!tenant) return [];
  const { data } = await sb
    .from("gss_items")
    .select(
      "id, min_qty, max_qty, reorder_point, notes, tracking_mode, qty_on_hand, local_name, local_manufacturer, local_type, product:gpc_products(id, gid, name, type, manufacturer)",
    )
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(500);
  return (data ?? []).map((row) => {
    const product = row.product as unknown as {
      id: string; gid: string; name: string; type: string; manufacturer: string | null;
    } | null;
    return {
      id: row.id,
      min_qty: row.min_qty,
      max_qty: row.max_qty,
      reorder_point: row.reorder_point,
      notes: row.notes,
      tracking_mode: row.tracking_mode,
      qty_on_hand: row.qty_on_hand,
      is_local: !product,
      product: product ?? {
        id: null,
        gid: "LOCAL",
        name: row.local_name ?? "(bez názvu)",
        type: row.local_type ?? "local",
        manufacturer: row.local_manufacturer,
      },
    };
  });
}
