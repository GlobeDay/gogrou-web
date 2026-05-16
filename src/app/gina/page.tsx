import Link from "next/link";
import { redirect } from "next/navigation";
import { Brain, TrendingDown, Wrench, Activity, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { getActiveTenant } from "@/lib/tenant";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface TopConsumed {
  tenant_id: string; item_id: string; product_id: string;
  product_gid: string; product_name: string; product_type: string;
  consumed_count: number; last_consumed_at: string;
}
interface Lifecycle {
  tenant_id: string; item_id: string;
  product_gid: string; product_name: string;
  total_pieces: number; at_max_cycles: number; near_max_cycles: number;
  avg_cycles_done: number | null;
}
interface Velocity { tenant_id: string; day: string; movement: string; cnt: number; }
interface ServiceItem {
  tenant_id: string; piece_id: string; dm_code: string; status: string;
  location_code: string | null; item_id: string;
  product_gid: string; product_name: string; product_type: string;
  updated_at: string; cycles_done: number; max_cycles: number;
}

export default async function GinaPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gina");
  const [sb, tenant] = await Promise.all([getServerSupabase(), getActiveTenant()]);
  if (!tenant) return <div className="mx-auto max-w-7xl px-4 py-6">Žádný aktivní tenant.</div>;

  const { data: tenantRow } = await sb.from("gss_tenants").select("id").eq("prefix", tenant).maybeSingle();
  if (!tenantRow) return null;

  // Načti všechny views paralelně (RLS scoped)
  const [topRes, lcRes, velRes, svcRes] = await Promise.all([
    sb.from("gina_top_consumed" as never).select("*").eq("tenant_id" as never, tenantRow.id)
      .order("consumed_count" as never, { ascending: false }).limit(10),
    sb.from("gina_lifecycle_summary" as never).select("*").eq("tenant_id" as never, tenantRow.id)
      .order("near_max_cycles" as never, { ascending: false }).limit(20),
    sb.from("gina_movement_velocity" as never).select("*").eq("tenant_id" as never, tenantRow.id)
      .order("day" as never, { ascending: false }),
    sb.from("gina_service_backlog" as never).select("*").eq("tenant_id" as never, tenantRow.id)
      .order("updated_at" as never, { ascending: false }).limit(20),
  ]);

  const top      = (topRes.data ?? []) as unknown as TopConsumed[];
  const lifecycle = (lcRes.data  ?? []) as unknown as Lifecycle[];
  const velocity  = (velRes.data ?? []) as unknown as Velocity[];
  const service   = (svcRes.data ?? []) as unknown as ServiceItem[];

  // Agg velocity: total movements last 7d / 14d
  const now = Date.now();
  const dayMs = 86_400_000;
  const total7  = velocity.filter((v) => now - new Date(v.day).getTime() < 7  * dayMs).reduce((a, v) => a + v.cnt, 0);
  const total14 = velocity.reduce((a, v) => a + v.cnt, 0);
  const trend = total14 > 0 ? Math.round(((total7 - (total14 - total7)) / Math.max(1, total14 - total7)) * 100) : 0;

  const totalAtMax  = lifecycle.reduce((a, l) => a + l.at_max_cycles, 0);
  const totalNearMax = lifecycle.reduce((a, l) => a + l.near_max_cycles, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-6 w-6" /> GINA Insights
        </h1>
        <span className="text-sm text-muted-foreground">tenant <span className="font-mono">{tenant}</span></span>
      </div>

      {/* Headline metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center gap-1 text-[10px] uppercase">
              <Activity className="h-3 w-3" /> Pohyby 7d
            </CardDescription>
            <CardTitle className="text-3xl">{total7}</CardTitle>
            <span className={`text-xs ${trend >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {trend >= 0 ? "+" : ""}{trend}% vs předchozí týden
            </span>
          </CardHeader>
        </Card>
        <Card className={totalAtMax > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center gap-1 text-[10px] uppercase">
              <AlertTriangle className="h-3 w-3" /> Na max cycles
            </CardDescription>
            <CardTitle className={`text-3xl ${totalAtMax > 0 ? "text-destructive" : ""}`}>{totalAtMax}</CardTitle>
            <span className="text-xs text-muted-foreground">{totalNearMax} blíže limitu</span>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center gap-1 text-[10px] uppercase">
              <Wrench className="h-3 w-3" /> Service backlog
            </CardDescription>
            <CardTitle className="text-3xl">{service.length}</CardTitle>
            <span className="text-xs text-muted-foreground">kusů čeká na servis</span>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center gap-1 text-[10px] uppercase">
              <TrendingDown className="h-3 w-3" /> Top konzumováno
            </CardDescription>
            <CardTitle className="text-3xl">{top[0]?.consumed_count ?? 0}×</CardTitle>
            <span className="text-xs text-muted-foreground truncate block">
              {top[0]?.product_name ?? "—"}
            </span>
          </CardHeader>
        </Card>
      </div>

      {/* Top consumed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top 10 konzumováno (30d)</CardTitle>
          <CardDescription>Počet pohybů service_out + scrap za posledních 30 dní</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produkt</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="text-right w-[100px]">Spotřeba</TableHead>
                <TableHead className="w-[170px]">Poslední</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top.map((t) => (
                <TableRow key={t.item_id}>
                  <TableCell>
                    <Link href={`/gss/item/${t.item_id}`} className="hover:underline">
                      <div className="font-medium">{t.product_name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{t.product_gid}</div>
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{t.product_type}</Badge></TableCell>
                  <TableCell className="text-right font-mono font-semibold">{t.consumed_count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(t.last_consumed_at)}</TableCell>
                </TableRow>
              ))}
              {top.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Žádné pohyby za 30 dní.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lifecycle health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lifecycle health — kusy blízko scrap limitu</CardTitle>
          <CardDescription>Pieces s cycles_done ≥ max_cycles − 1</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produkt</TableHead>
                <TableHead className="text-right">Total kusů</TableHead>
                <TableHead className="text-right">Avg cycles</TableHead>
                <TableHead className="text-right">Blíže limitu</TableHead>
                <TableHead className="text-right">Na limitu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lifecycle.filter((l) => l.near_max_cycles > 0).map((l) => (
                <TableRow key={l.item_id}>
                  <TableCell>
                    <Link href={`/gss/item/${l.item_id}`} className="hover:underline">
                      <div className="font-medium">{l.product_name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{l.product_gid}</div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono">{l.total_pieces}</TableCell>
                  <TableCell className="text-right font-mono">{l.avg_cycles_done ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-yellow-600 font-semibold">{l.near_max_cycles}</TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${l.at_max_cycles > 0 ? "text-destructive" : ""}`}>
                    {l.at_max_cycles}
                  </TableCell>
                </TableRow>
              ))}
              {lifecycle.filter((l) => l.near_max_cycles > 0).length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Vše v zelené zóně.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Service backlog */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Service backlog</CardTitle>
          <CardDescription>Kusy ve stavu in_service nebo na SERVICE_BIN lokaci</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DM</TableHead>
                <TableHead>Produkt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lokace</TableHead>
                <TableHead className="text-right">Cycles</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {service.map((s) => (
                <TableRow key={s.piece_id}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/gss/scan?dm=${encodeURIComponent(s.dm_code)}`} className="hover:underline">{s.dm_code}</Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/gss/item/${s.item_id}`} className="hover:underline">
                      <div className="text-sm">{s.product_name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{s.product_gid}</div>
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="font-mono text-xs">{s.status}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{s.location_code ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{s.cycles_done}{s.max_cycles ? ` / ${s.max_cycles}` : ""}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{fmtDate(s.updated_at)}</TableCell>
                </TableRow>
              ))}
              {service.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">Prázdný backlog. 🎉</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Movement velocity sparkline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Aktivita za 14 dní</CardTitle>
          <CardDescription>Pohyby per typ</CardDescription>
        </CardHeader>
        <CardContent>
          <VelocityChart data={velocity} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        GINA = read-only insights vrstva (Gogrou MVP sekce 5). Žádná autonomní akce — jen návrhy.
      </p>
    </div>
  );
}

function VelocityChart({ data }: { data: Velocity[] }) {
  // Group by day, then by movement
  const byDay = new Map<string, Record<string, number>>();
  for (const v of data) {
    const m = byDay.get(v.day) ?? {};
    m[v.movement] = (m[v.movement] ?? 0) + v.cnt;
    byDay.set(v.day, m);
  }
  const sortedDays = [...byDay.keys()].sort();
  if (sortedDays.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Žádné pohyby v posledních 14 dnech.</p>;
  }

  const maxCnt = Math.max(1, ...sortedDays.map((d) => Object.values(byDay.get(d)!).reduce((a, b) => a + b, 0)));

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1 h-32">
        {sortedDays.map((d) => {
          const m = byDay.get(d)!;
          const total = Object.values(m).reduce((a, b) => a + b, 0);
          const h = (total / maxCnt) * 100;
          return (
            <div key={d} className="flex-1 flex flex-col items-center gap-1" title={`${d}: ${total}`}>
              <div className="w-full bg-primary rounded-sm" style={{ height: `${h}%` }} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{sortedDays[0]}</span>
        <span>{sortedDays[sortedDays.length - 1]}</span>
      </div>
    </div>
  );
}
