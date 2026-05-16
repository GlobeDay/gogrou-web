import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/brand-mark";
import { supabase, TOOL_TYPE_LABELS, type ToolType } from "@/lib/supabase";
import { Boxes, ScanLine, Warehouse, Brain, ArrowRight, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    { count: products },
    { count: pieces },
    { count: items },
    { data: byType },
  ] = await Promise.all([
    supabase.from("gpc_products").select("*", { count: "exact", head: true }),
    supabase.from("gss_pieces").select("*", { count: "exact", head: true }),
    supabase.from("gss_items").select("*", { count: "exact", head: true }),
    supabase.from("gpc_products").select("type"),
  ]);
  const typeCounts: Record<string, number> = {};
  for (const r of byType ?? []) typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1;
  return { products: products ?? 0, pieces: pieces ?? 0, items: items ?? 0, typeCounts };
}

const QUICK_LINKS = [
  { href: "/gpc",           label: "GPC katalog", desc: "Hledat produkty", icon: Boxes,     accent: "text-primary" },
  { href: "/gss/scan",      label: "DM Scan",     desc: "Skenovat kus",    icon: ScanLine,  accent: "text-primary" },
  { href: "/gss/low-stock", label: "Reorder",     desc: "Co dochází",      icon: Warehouse, accent: "text-warning" },
  { href: "/gina",          label: "GINA",        desc: "AI insights",     icon: Brain,     accent: "text-info" },
];

export default async function HomePage() {
  const stats = await getStats();

  const metrics = [
    { label: "GPC produktů",    value: stats.products.toLocaleString("cs-CZ"),         hint: "napříč všemi tenants", icon: Boxes },
    { label: "Skladové karty",  value: stats.items.toLocaleString("cs-CZ"),            hint: "aktivní items",        icon: Wrench },
    { label: "DM kusů",         value: stats.pieces.toLocaleString("cs-CZ"),           hint: "v GSS evidenci",       icon: ScanLine },
    { label: "Tool types",      value: Object.keys(stats.typeCounts).length.toString(), hint: "v aktivním katalogu", icon: Brain },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-10">
      {/* Hero */}
      <header className="relative animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="flex items-start gap-6 flex-wrap">
          <BrandMark size={56} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold tracking-tight">Gogrou MVP</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              B2B platforma pro výrobní firmy — sjednocený katalog nástrojů (GPC) a provozní vrstva
              skladu, kusové evidence a pohybů (GSS). Modulární, JSONB-driven, audit-ready.
            </p>
            <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
              <Badge variant="outline" className="font-mono">tenant: {process.env.NEXT_PUBLIC_DEFAULT_TENANT}</Badge>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Live demo
              </span>
            </div>
          </div>
        </div>
        <div className="etched-line mt-8" aria-hidden />
      </header>

      {/* Headline metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className="animate-in fade-in slide-in-from-bottom-1 duration-500"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
          >
            <MetricCard {...m} />
          </div>
        ))}
      </section>

      {/* Quick links */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Rychlý přístup</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map(({ href, label, desc, icon: Icon, accent }, i) => (
            <Link
              key={href}
              href={href}
              className="group animate-in fade-in slide-in-from-bottom-1 duration-500"
              style={{ animationDelay: `${300 + i * 60}ms`, animationFillMode: "backwards" }}
            >
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Icon className={`h-6 w-6 ${accent} transition-transform group-hover:scale-110`} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="font-semibold">{label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Tool types breakdown */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Katalog dle typu</h2>
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {Object.entries(stats.typeCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([t, n], i) => {
                  const label = TOOL_TYPE_LABELS[t as ToolType]?.cs ?? t;
                  return (
                    <Link
                      key={t}
                      href={`/gpc?type=${encodeURIComponent(t)}`}
                      className="group flex flex-col gap-0.5 rounded-md border border-border bg-background px-3 py-2.5 hover:border-primary/50 hover:bg-accent transition-colors animate-in fade-in duration-500"
                      style={{ animationDelay: `${600 + i * 30}ms`, animationFillMode: "backwards" }}
                    >
                      <span className="text-xs text-muted-foreground font-mono truncate" title={t}>{t}</span>
                      <span className="text-lg font-semibold tabular-nums">{n.toLocaleString("cs-CZ")}</span>
                      <span className="text-[10px] text-muted-foreground/70 truncate">{label}</span>
                    </Link>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  label, value, hint, icon: Icon,
}: { label: string; value: string; hint?: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <CardDescription className="text-[11px] uppercase tracking-wide">{label}</CardDescription>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
        {hint && <span className="text-xs text-muted-foreground/80">{hint}</span>}
      </CardHeader>
    </Card>
  );
}
