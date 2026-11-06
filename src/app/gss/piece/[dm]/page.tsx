import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Printer, ScanLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { fmtDate } from "@/lib/format";
import {
  CONDITION_LABELS,
  DOCUMENT_TYPE_LABELS,
  RECEIPT_SOURCE_LABELS,
  asLifecycle,
  type PieceCondition,
} from "@/lib/gss-lock";
import { StatusBadge } from "@/components/status-badge";

type Params = Promise<{ dm: string }>;

export const dynamic = "force-dynamic";

export default async function PieceDetailPage({ params }: { params: Params }) {
  const { dm: rawDm } = await params;
  const dm = decodeURIComponent(rawDm);
  const user = await getServerUser();
  if (!user) redirect(`/login?next=/gss/piece/${encodeURIComponent(dm)}`);

  const sb = await getServerSupabase();
  const { data: piece, error } = await sb
    .from("gss_pieces")
    .select(`id, dm_code, qid, status, condition, lifecycle, created_at, updated_at, item_id,
             item:gss_items!inner(id, local_name, local_manufacturer, local_type,
               product:gpc_products(id, gid, name, manufacturer, type),
               tenant:gss_tenants!inner(prefix, name)),
             location:gss_locations!gss_pieces_current_location_id_fkey(code, name)`)
    .eq("dm_code", dm)
    .maybeSingle();
  if (error || !piece) notFound();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const p = piece as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const life = asLifecycle(p.lifecycle);
  const product = p.item?.product ?? {
    id: null,
    gid: "LOCAL",
    name: p.item?.local_name ?? "(bez názvu)",
    manufacturer: p.item?.local_manufacturer,
    type: p.item?.local_type ?? "local",
  };

  const [eventsRes, movementsRes] = await Promise.all([
    sb.from("gss_piece_service_events")
      .select("id, cycle_no, diameter_mm, l1_mm, l2_mm, performer, event_date, notes, created_by, created_at")
      .eq("piece_id", p.id)
      .order("cycle_no", { ascending: false }),
    sb.from("gss_movements")
      .select(`id, occurred_at, movement, payload, created_by,
               from_location:gss_locations!gss_movements_from_location_id_fkey(code),
               to_location:gss_locations!gss_movements_to_location_id_fkey(code)`)
      .eq("piece_id", p.id)
      .order("occurred_at", { ascending: false })
      .limit(100),
  ]);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const events = (eventsRes.data ?? []) as any[];
  const movs = (movementsRes.data ?? []) as any[];
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Příjmové info z prvního receive pohybu (payload nese doklad)
  const receiveMv = [...movs].reverse().find((m) => m.movement === "receive");
  const receivePayload = (receiveMv?.payload ?? {}) as Record<string, unknown>;
  const receiptSource = receivePayload.receipt_source as keyof typeof RECEIPT_SOURCE_LABELS | undefined;
  const documentType = receivePayload.document_type as keyof typeof DOCUMENT_TYPE_LABELS | undefined;

  const cyclesDone = life.sharpening?.cycles_done ?? 0;
  const maxCycles = life.sharpening?.max_cycles;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      <Link href={`/gss/item/${p.item_id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Zpět na kartu položky
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">{p.dm_code}</h1>
          <div className="text-sm text-muted-foreground mt-1">
            QID: <span className="font-mono">{p.qid ?? "—"}</span>
            {" · "}
            {product.id ? (
              <Link href={`/gpc/${product.id}`} className="hover:underline">{product.name}</Link>
            ) : (
              product.name
            )}
            {" · "}{product.manufacturer ?? "—"} · tenant <span className="font-mono">{p.item?.tenant?.prefix}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={p.status} />
          <Badge variant="outline">
            {CONDITION_LABELS[p.condition as PieceCondition] ?? p.condition}
          </Badge>
          {life.reservation?.active && <Badge variant="secondary">Rezervováno</Badge>}
          {life.blocked && <Badge variant="destructive">Blokováno</Badge>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={`/gss/scan?dm=${encodeURIComponent(p.dm_code)}`} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 hover:bg-accent">
          <ScanLine className="h-4 w-4" /> Otevřít ve scan terminálu
        </Link>
        <Link href={`/gss/label/${encodeURIComponent(p.dm_code)}`} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 hover:bg-accent">
          <Printer className="h-4 w-4" /> Štítek
        </Link>
      </div>

      <Separator />

      {/* Kondice a lokace odděleně (AT-006) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="text-2xs uppercase tracking-wide">Kondice</CardDescription>
            <CardTitle className="text-lg">{CONDITION_LABELS[p.condition as PieceCondition] ?? p.condition}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="text-2xs uppercase tracking-wide">Lokace</CardDescription>
            <CardTitle className="text-lg font-mono">{p.location?.code ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="text-2xs uppercase tracking-wide">Cykly broušení</CardDescription>
            <CardTitle className="text-lg font-mono">{cyclesDone}{maxCycles ? ` / ${maxCycles}` : ""}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="text-2xs uppercase tracking-wide">Aktuální D / L1 / L2</CardDescription>
            <CardTitle className="text-lg font-mono">
              {life.sharpening?.diameter_mm ?? "—"} / {life.sharpening?.l1_mm ?? "—"} / {life.sharpening?.l2_mm ?? "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {life.reservation?.active && (
        <Card>
          <CardHeader className="pb-2"><CardDescription>Rezervace</CardDescription></CardHeader>
          <CardContent className="text-sm flex flex-wrap gap-x-6 gap-y-1">
            <span>Zakázka: <span className="font-mono">{life.reservation.order ?? "—"}</span></span>
            <span>Stroj: <span className="font-mono">{life.reservation.machine ?? "—"}</span></span>
            <span>Do: {life.reservation.until ? fmtDate(life.reservation.until) : "—"}</span>
            {life.reservation.reason && <span className="text-muted-foreground">{life.reservation.reason}</span>}
          </CardContent>
        </Card>
      )}

      {/* Příjem */}
      <Card>
        <CardHeader className="pb-2"><CardDescription>Příjem</CardDescription></CardHeader>
        <CardContent className="text-sm flex flex-wrap gap-x-6 gap-y-1">
          <span>Přijato: {receiveMv ? fmtDate(receiveMv.occurred_at) : fmtDate(p.created_at)}</span>
          <span>Kým: <span className="font-mono">{receiveMv?.created_by ?? "—"}</span></span>
          <span>Zdroj: {receiptSource ? RECEIPT_SOURCE_LABELS[receiptSource] : "—"}</span>
          <span>Doklad: {documentType ? DOCUMENT_TYPE_LABELS[documentType] : "—"}{receivePayload.doc_no ? ` · ${String(receivePayload.doc_no)}` : ""}</span>
        </CardContent>
      </Card>

      {/* Historie broušení D/L1/L2 per cyklus (AT-020) */}
      <Card>
        <CardHeader className="pb-2"><CardDescription>Historie broušení ({events.length})</CardDescription></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px] text-right">Cyklus</TableHead>
                <TableHead className="text-right">D [mm]</TableHead>
                <TableHead className="text-right">L1 [mm]</TableHead>
                <TableHead className="text-right">L2 [mm]</TableHead>
                <TableHead>Provedl</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Poznámka</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-right font-mono text-xs">{e.cycle_no}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{e.diameter_mm ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{e.l1_mm ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{e.l2_mm ?? "—"}</TableCell>
                  <TableCell className="text-xs">{e.performer ?? e.created_by ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.event_date ? fmtDate(e.event_date) : fmtDate(e.created_at)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.notes ?? "—"}</TableCell>
                </TableRow>
              ))}
              {events.length === 0 && <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">Zatím žádné servisní záznamy.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pohyby kusu */}
      <Card>
        <CardHeader className="pb-2"><CardDescription>Pohyby ({movs.length})</CardDescription></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Čas</TableHead>
                <TableHead className="w-[120px]">Movement</TableHead>
                <TableHead>Z → na</TableHead>
                <TableHead>Kdo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movs.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(m.occurred_at)}</TableCell>
                  <TableCell><StatusBadge status={m.movement} /></TableCell>
                  <TableCell className="text-xs">
                    <span className="font-mono">{m.from_location?.code ?? "—"}</span>
                    {" → "}
                    <span className="font-mono">{m.to_location?.code ?? "—"}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.created_by ?? "—"}</TableCell>
                </TableRow>
              ))}
              {movs.length === 0 && <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Zatím žádné pohyby.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Kus založen: {fmtDate(p.created_at)} · poslední změna: {fmtDate(p.updated_at)}
      </div>
    </div>
  );
}
