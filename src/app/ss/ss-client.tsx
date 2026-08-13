"use client";

import { useState } from "react";
import {
  Handshake, Users, CalendarClock, BadgePercent, PiggyBank, ArrowRight, Boxes, CircleCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataSection } from "@/components/data-section";
import { Eyebrow } from "@/components/eyebrow";
import { cn } from "@/lib/utils";
import {
  SS_CAMPAIGNS, SS_STATUS_META, currentTier, nextTier, estimatedSavings, fmtCzk,
  type SsCampaign,
} from "./data";

type GraphicVariant = "a" | "b" | "c";

const VARIANTS: { key: GraphicVariant; label: string; desc: string }[] = [
  { key: "a", label: "A · Operations",  desc: "hustá tabulka, styl GSS" },
  { key: "b", label: "B · Marketplace", desc: "karty s tier ladderem" },
  { key: "c", label: "C · Kampaně",     desc: "vizuální hero + řádky" },
];

const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });
const pct = (c: SsCampaign) => Math.min(100, Math.round((c.committedQty / c.targetQty) * 100));

export function SsClient() {
  const [variant, setVariant] = useState<GraphicVariant>("a");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Head + přepínač grafických variant */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Handshake className="h-6 w-6" /> SmartSplit
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Skupinové nákupy a cenové akce · <Badge variant="neutral" className="align-middle">DEMO</Badge>
          </p>
        </div>
        <div className="space-y-1">
          <Eyebrow className="text-muted-foreground/70">Varianta grafiky</Eyebrow>
          <div className="inline-flex rounded-lg bg-muted p-[3px] gap-0.5">
            {VARIANTS.map((v) => (
              <Button
                key={v.key}
                size="xs"
                variant="ghost"
                title={v.desc}
                aria-pressed={variant === v.key}
                onClick={() => setVariant(v.key)}
                className={cn(
                  "h-7 px-3",
                  variant === v.key && "bg-background shadow-sm text-foreground hover:bg-background",
                )}
              >
                {v.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {variant === "a" && <VariantOperations />}
      {variant === "b" && <VariantMarketplace />}
      {variant === "c" && <VariantHero />}
    </div>
  );
}

/* ============================================================
 * Sdílené drobky
 * ============================================================ */

function ProgressBar({ value, className, tone = "primary" }: { value: number; className?: string; tone?: "primary" | "success" }) {
  return (
    <div className={cn("h-1.5 rounded-full bg-muted overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all", tone === "success" ? "bg-success" : "bg-primary")}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function StatusPill({ c }: { c: SsCampaign }) {
  const meta = SS_STATUS_META[c.status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function aggregates() {
  const active = SS_CAMPAIGNS.filter((c) => c.status === "open" || c.status === "closing");
  return {
    activeCount: active.length,
    committed: SS_CAMPAIGNS.reduce((a, c) => a + c.committedQty, 0),
    participants: SS_CAMPAIGNS.reduce((a, c) => a + c.participants, 0),
    savings: SS_CAMPAIGNS.reduce((a, c) => a + estimatedSavings(c), 0),
  };
}

/* ============================================================
 * VARIANTA A — „Operations“: hustá tabulka ve stylu GSS
 * ============================================================ */

function VariantOperations() {
  const agg = aggregates();
  const metrics = [
    { label: "Aktivní kampaně", value: String(agg.activeCount), hint: "open + poslední dny", icon: Handshake },
    { label: "Nasbíráno kusů",  value: agg.committed.toLocaleString("cs-CZ"), hint: "napříč kampaněmi", icon: Boxes },
    { label: "Účastníků",       value: String(agg.participants), hint: "firem v poolu", icon: Users },
    { label: "Odhad úspor",     value: fmtCzk(agg.savings), hint: "při dosažených tierech", icon: PiggyBank },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-1">
              <CardDescription className="flex items-center gap-1.5 text-2xs uppercase tracking-label">
                <m.icon className="h-3.5 w-3.5" aria-hidden /> {m.label}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">{m.value}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">{m.hint}</CardContent>
          </Card>
        ))}
      </div>

      <DataSection
        title="Kampaně"
        description="Skupinové poptávky — sleva roste s nasbíraným množstvím."
        noPadding
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kampaň</TableHead>
              <TableHead className="hidden md:table-cell">Produkt</TableHead>
              <TableHead className="w-[180px]">Průběh</TableHead>
              <TableHead className="text-right">Sleva</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Účastníci</TableHead>
              <TableHead className="text-right">Deadline</TableHead>
              <TableHead className="text-right">Stav</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SS_CAMPAIGNS.map((c) => {
              const t = currentTier(c);
              const nx = nextTier(c);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.title}</div>
                    <div className="font-mono text-2xs text-muted-foreground">{c.id}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-xs">{c.productName}</div>
                    <div className="font-mono text-2xs text-muted-foreground">{c.partNo}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-between text-2xs text-muted-foreground mb-1 tabular-nums">
                      <span>{c.committedQty} / {c.targetQty} ks</span>
                      <span>{pct(c)} %</span>
                    </div>
                    <ProgressBar value={pct(c)} tone={c.status === "fulfilled" ? "success" : "primary"} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <div className="font-semibold">{t ? `−${t.discountPct} %` : "—"}</div>
                    {nx && (
                      <div className="text-2xs text-muted-foreground">
                        další −{nx.discountPct} % od {nx.minQty} ks
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right tabular-nums">{c.participants}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{fmtDay(c.deadline)}</TableCell>
                  <TableCell className="text-right"><StatusPill c={c} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DataSection>
    </div>
  );
}

/* ============================================================
 * VARIANTA B — „Marketplace“: karty s tier ladderem a CTA
 * ============================================================ */

function VariantMarketplace() {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {SS_CAMPAIGNS.map((c) => {
        const t = currentTier(c);
        const joinable = c.status === "open" || c.status === "closing";
        const d = daysLeft(c.deadline);
        return (
          <Card key={c.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base leading-tight">{c.title}</CardTitle>
                  <CardDescription className="mt-0.5">
                    {c.manufacturer} · <span className="font-mono text-2xs">{c.partNo}</span>
                  </CardDescription>
                </div>
                <StatusPill c={c} />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 pt-0">
              {/* Průběh */}
              <div>
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="text-muted-foreground tabular-nums">{c.committedQty} / {c.targetQty} ks</span>
                  <span className="font-semibold tabular-nums">{pct(c)} %</span>
                </div>
                <ProgressBar value={pct(c)} className="h-2" tone={c.status === "fulfilled" ? "success" : "primary"} />
              </div>

              {/* Tier ladder */}
              <div className="grid grid-cols-3 gap-1.5">
                {c.tiers.map((tier) => {
                  const reached = c.committedQty >= tier.minQty;
                  return (
                    <div
                      key={tier.minQty}
                      className={cn(
                        "rounded-md border px-2 py-1.5 text-center",
                        reached
                          ? "border-primary/30 bg-primary/12 text-primary"
                          : "border-border bg-muted/40 text-muted-foreground",
                      )}
                    >
                      <div className="text-sm font-bold tabular-nums">−{tier.discountPct} %</div>
                      <div className="text-2xs tabular-nums">od {tier.minQty} ks</div>
                    </div>
                  );
                })}
              </div>

              {/* Cena */}
              <div className="text-xs text-muted-foreground">
                Katalog <span className="tabular-nums">{fmtCzk(c.unitPrice)}</span>/ks
                {t && (
                  <>
                    {" · nyní "}
                    <span className="font-semibold text-foreground tabular-nums">
                      {fmtCzk(Math.round(c.unitPrice * (1 - t.discountPct / 100)))}
                    </span>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-3 text-2xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden />{c.participants}</span>
                  <span className="flex items-center gap-1 tabular-nums">
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                    {c.status === "fulfilled" ? "uzavřeno" : d > 0 ? `${d} dní` : "dnes"}
                  </span>
                </div>
                {joinable ? (
                  <Button size="sm">
                    Přidat poptávku <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                ) : c.status === "fulfilled" ? (
                  <span className="flex items-center gap-1 text-xs text-success font-medium">
                    <CircleCheck className="h-4 w-4" aria-hidden /> Naplněno
                  </span>
                ) : (
                  <Button size="sm" variant="outline" disabled>Již brzy</Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ============================================================
 * VARIANTA C — „Kampaně“: vizuální hero + full-width řádky
 * ============================================================ */

function VariantHero() {
  const agg = aggregates();
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/12 via-background to-background p-6 lg:p-8">
        <BadgePercent className="absolute -right-6 -top-6 h-40 w-40 text-primary/10" aria-hidden />
        <Eyebrow className="text-primary">SmartSplit pool</Eyebrow>
        <div className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight tabular-nums">
          {fmtCzk(agg.savings)}
        </div>
        <p className="mt-1 text-sm text-muted-foreground max-w-md">
          Odhadovaná úspora napříč {SS_CAMPAIGNS.length} kampaněmi.
          Čím víc firem se přidá, tím hlubší sleva pro všechny.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5"><Handshake className="h-4 w-4 text-primary" aria-hidden /><b className="tabular-nums">{agg.activeCount}</b> aktivní kampaně</span>
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" aria-hidden /><b className="tabular-nums">{agg.participants}</b> účastníků</span>
          <span className="flex items-center gap-1.5"><Boxes className="h-4 w-4 text-primary" aria-hidden /><b className="tabular-nums">{agg.committed.toLocaleString("cs-CZ")}</b> ks v poolu</span>
        </div>
      </div>

      {/* Řádky kampaní */}
      <div className="space-y-3">
        {SS_CAMPAIGNS.map((c) => {
          const t = currentTier(c);
          const nx = nextTier(c);
          const d = daysLeft(c.deadline);
          const joinable = c.status === "open" || c.status === "closing";
          return (
            <Card key={c.id}>
              <CardContent className="py-4 flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Sleva */}
                <div className="shrink-0 w-24 text-center lg:border-r lg:border-border/60 lg:pr-4">
                  <div className={cn("text-3xl font-bold tabular-nums", t ? "text-primary" : "text-muted-foreground/50")}>
                    {t ? `−${t.discountPct}%` : "—"}
                  </div>
                  <div className="text-2xs text-muted-foreground uppercase tracking-label">aktuální sleva</div>
                </div>

                {/* Info + progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{c.title}</span>
                    <StatusPill c={c} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {c.productName} · <span className="font-mono text-2xs">{c.partNo}</span>
                  </div>
                  <div className="mt-2.5">
                    <ProgressBar value={pct(c)} className="h-2.5" tone={c.status === "fulfilled" ? "success" : "primary"} />
                    <div className="flex justify-between text-2xs text-muted-foreground mt-1 tabular-nums">
                      <span>{c.committedQty} / {c.targetQty} ks · {c.participants} firem</span>
                      <span>{nx ? `−${nx.discountPct} % od ${nx.minQty} ks` : "max. tier dosažen"}</span>
                    </div>
                  </div>
                </div>

                {/* Deadline + CTA */}
                <div className="shrink-0 flex lg:flex-col items-center lg:items-end gap-2 lg:gap-1.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                    {c.status === "fulfilled" ? "uzavřeno" : d > 0 ? `zbývá ${d} dní` : `do ${fmtDay(c.deadline)}`}
                  </span>
                  {joinable
                    ? <Button size="sm">Přidat poptávku</Button>
                    : c.status === "draft"
                      ? <Button size="sm" variant="outline" disabled>Již brzy</Button>
                      : <span className="flex items-center gap-1 text-xs text-success font-medium"><CircleCheck className="h-4 w-4" aria-hidden />Hotovo</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
