import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { can, getActiveTenant } from "@/lib/tenant";
import { asLifecycle, CONDITION_LABELS, type PieceCondition } from "@/lib/gss-lock";
import { DecideForm } from "./decide-form";

export const dynamic = "force-dynamic";

type QueueRow = {
  id: string;
  dm_code: string;
  qid: string | null;
  condition: PieceCondition | null;
  lifecycle: unknown;
  updated_at: string;
  item: {
    id: string;
    local_name: string | null;
    product: { name: string; gid: string } | null;
  };
};

export default async function DecisionsPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/decisions");

  const [sb, tenant, canDecide] = await Promise.all([
    getServerSupabase(),
    getActiveTenant(),
    can("gss.edit_lifecycle"),
  ]);
  if (!tenant) {
    return <div className="mx-auto max-w-3xl px-4 py-6"><Card><CardContent className="py-4 text-sm">Žádný aktivní tenant.</CardContent></Card></div>;
  }
  const { data: tenantRow } = await sb.from("gss_tenants").select("id").eq("prefix", tenant).maybeSingle();
  if (!tenantRow) return null;

  const { data, error } = await sb
    .from("gss_pieces")
    .select("id, dm_code, qid, condition, lifecycle, updated_at, item:gss_items!inner(id, local_name, product:gpc_products(name, gid))")
    .eq("tenant_id", tenantRow.id)
    .eq("status", "awaiting_decision")
    .order("updated_at", { ascending: true })
    .limit(200);

  const rows = ((data ?? []) as unknown as QueueRow[]).map((p) => {
    const life = asLifecycle(p.lifecycle);
    return {
      ...p,
      name: p.item.product?.name ?? p.item.local_name ?? "(bez názvu)",
      gid: p.item.product?.gid ?? "LOCAL",
      cycles: life.sharpening?.max_cycles
        ? `${life.sharpening.cycles_done ?? 0}/${life.sharpening.max_cycles}`
        : life.sharpening?.cycles_done != null
          ? String(life.sharpening.cycles_done)
          : null,
      blocked: Boolean(life.blocked),
    };
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <Link href="/gss/terminal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Terminál
      </Link>
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Čeká na rozhodnutí</h1>
        <span className="text-sm text-muted-foreground">
          tenant <span className="font-mono">{tenant}</span> · {rows.length} kusů ve frontě
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Rozhodovací fronta po návratu z výroby — rozhodnutí spouští workflow (sklad / broušení / vyřazení / blokace).
      </p>

      {error && <Card><CardContent className="py-3 text-sm text-destructive">Chyba: {error.message}</CardContent></Card>}

      {!canDecide && rows.length > 0 && (
        <p className="text-xs text-muted-foreground">Rozhodnutí může provést supervisor a vyšší.</p>
      )}

      {rows.map((p) => (
        <Card key={p.id}>
          <CardContent className="py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/gss/piece/${encodeURIComponent(p.dm_code)}`} className="font-mono text-sm font-semibold hover:underline">
                  {p.dm_code}
                </Link>
                {p.condition && <Badge variant="outline" className="text-2xs">{CONDITION_LABELS[p.condition]}</Badge>}
                {p.cycles && <Badge variant="secondary" className="font-mono text-2xs">brusy {p.cycles}</Badge>}
                {p.blocked && <Badge variant="destructive" className="text-2xs">BLOKOVÁN</Badge>}
              </div>
              <div className="text-sm">{p.name}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {p.gid}{p.qid ? ` · ${p.qid}` : ""} · ve frontě od {new Date(p.updated_at).toLocaleString("cs-CZ")}
              </div>
            </div>
            {canDecide && <DecideForm dmCode={p.dm_code} />}
          </CardContent>
        </Card>
      ))}

      {rows.length === 0 && !error && (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Fronta je prázdná — žádný kus nečeká na rozhodnutí.</CardContent></Card>
      )}
    </div>
  );
}
