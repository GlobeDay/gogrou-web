import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { inferStatusFromMovement } from "@/lib/scan-logic";

const MoveBody = z.object({
  tenant_prefix:      z.string(),
  piece_dm_code:      z.string().min(1),
  movement:           z.enum(["receive","issue","transfer","service_out","service_in","scrap","adjust"]),
  from_location_code: z.string().optional(),
  to_location_code:   z.string().optional(),
  payload:            z.record(z.string(), z.any()).default({}),
  created_by:         z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof MoveBody>;
  try { body = MoveBody.parse(await req.json()); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Bad request" }, { status: 400 }); }

  const sb = await getServerSupabase();

  const { data: tenant } = await sb.from("gss_tenants").select("id").eq("prefix", body.tenant_prefix).maybeSingle();
  if (!tenant) return NextResponse.json({ error: "Tenant nenalezen" }, { status: 404 });

  const { data: piece, error: pieceErr } = await sb
    .from("gss_pieces").select("id, item_id, current_location_id, status")
    .eq("tenant_id", tenant.id).eq("dm_code", body.piece_dm_code).maybeSingle();
  if (pieceErr) return NextResponse.json({ error: pieceErr.message }, { status: 500 });
  if (!piece)   return NextResponse.json({ error: `DM '${body.piece_dm_code}' nenalezeno` }, { status: 404 });

  async function locId(code?: string): Promise<string | null> {
    if (!code) return null;
    const { data: loc } = await sb.from("gss_locations").select("id")
      .eq("tenant_id", tenant!.id).eq("code", code).maybeSingle();
    if (!loc) throw new Error(`Location '${code}' neexistuje`);
    return loc.id;
  }

  let fromId: string | null = piece.current_location_id;
  let toId:   string | null = null;
  try {
    fromId = (await locId(body.from_location_code)) ?? piece.current_location_id;
    toId   = await locId(body.to_location_code);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Location error" }, { status: 400 });
  }

  const newStatus = inferStatusFromMovement(body.movement, body.to_location_code);

  const { error: updErr } = await sb.from("gss_pieces")
    .update({ current_location_id: toId, status: newStatus ?? piece.status })
    .eq("id", piece.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  const { data: mv, error: mvErr } = await sb.from("gss_movements").insert({
    tenant_id:        tenant.id,
    movement:         body.movement,
    piece_id:         piece.id,
    item_id:          piece.item_id,
    from_location_id: fromId,
    to_location_id:   toId,
    payload:          body.payload as never,
    created_by:       body.created_by ?? user.email ?? null,
  }).select("*").single();
  if (mvErr) return NextResponse.json({ error: mvErr.message }, { status: 500 });

  return NextResponse.json({
    movement_id:  mv.id,
    piece_id:     piece.id,
    new_status:   newStatus ?? piece.status,
    new_location: body.to_location_code ? { code: body.to_location_code } : null,
    occurred_at:  mv.occurred_at,
  });
}
