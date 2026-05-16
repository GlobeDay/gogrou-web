"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ScanLine, Loader2, AlertTriangle, Info, Send, ArrowRight, Lock, CheckCircle2, Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { scan, move, type ScanResponse } from "@/lib/api";
import { fmtValue } from "@/lib/format";

type Role = "viewer" | "operator" | "supervisor" | "admin" | null;

const ROLE_CAPS: Record<NonNullable<Role>, Set<string>> = {
  viewer:     new Set([]),
  operator:   new Set(["transfer"]),
  supervisor: new Set(["transfer", "scrap"]),
  admin:      new Set(["transfer", "scrap"]),
};

function canDo(role: Role, action: "transfer" | "scrap"): boolean {
  if (!role) return false;
  return ROLE_CAPS[role].has(action);
}

export function ScanClient({ tenant, role }: { tenant: string; role: Role }) {
  const [dmCode, setDmCode] = useState("");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const scanMut = useMutation({
    mutationFn: () =>
      scan({ tenant_prefix: tenant, dm_code: dmCode.trim(), event: "RETURN_FROM_MACHINE" }),
    onSuccess: (data) => setResult(data),
    onError:   (err)  => { toast.error(String(err)); setResult(null); },
  });

  const moveMut = useMutation({
    mutationFn: (action: { to: string | null; movement: "transfer" | "service_in" | "service_out" | "scrap" }) =>
      move({
        tenant_prefix:      tenant,
        piece_dm_code:      dmCode.trim(),
        movement:           action.movement,
        from_location_code: result?.piece.current_location?.code,
        to_location_code:   action.to ?? undefined,
        payload:            { source: "DM Scan UI" },
        created_by:         "scan_ui",
      }),
    onSuccess: (data) => {
      toast.success(`Přesun → ${data.new_location?.code ?? "—"} (${data.new_status})`);
      scanMut.mutate();
      qc.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (err) => toast.error(String(err)),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dmCode.trim()) return;
    setResult(null);
    scanMut.mutate();
  }

  function clear() {
    setDmCode("");
    setResult(null);
    inputRef.current?.focus();
  }

  // data-mode="shopfloor" → globals.css forces hi-contrast dark tokens
  return (
    <div data-mode="shopfloor" className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Hero header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/15 p-2 brand-glow">
              <ScanLine className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Shop floor</h1>
              <p className="text-sm text-muted-foreground">DM Scan terminál · operátorský režim</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-mono">{tenant}</Badge>
            {role && <Badge variant="outline" className="uppercase text-[10px]">{role}</Badge>}
          </div>
        </div>

        {/* Hero input — big, centered, mono */}
        <Card className="border-primary/25">
          <CardContent className="py-8">
            <form onSubmit={onSubmit} className="flex flex-col items-center gap-4">
              <label htmlFor="dm" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Naskenuj nebo napiš DM kód
              </label>
              <div className="flex w-full max-w-2xl gap-2">
                <Input
                  ref={inputRef} id="dm"
                  autoFocus autoComplete="off" spellCheck={false}
                  placeholder="DM-..."
                  className="dm-input h-16 text-center"
                  value={dmCode}
                  onChange={(e) => setDmCode(e.target.value.toUpperCase())}
                />
                <Button type="submit" size="lg" className="h-16 px-6 text-base"
                  disabled={scanMut.isPending || !dmCode.trim()}>
                  {scanMut.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
              {dmCode && (
                <button type="button" onClick={clear} className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                  Vyčistit (Esc)
                </button>
              )}
            </form>
          </CardContent>
        </Card>

        {scanMut.isPending && (
          <Card><CardContent className="flex items-center justify-center gap-3 py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Načítám piece + product…
          </CardContent></Card>
        )}

        {result && <ScanResult data={result} role={role} onAction={moveMut.mutate} actionPending={moveMut.isPending} />}
      </div>
    </div>
  );
}

function SeverityBlock({ s }: { s: "info" | "warning" | "critical" }) {
  const map = {
    critical: { Icon: AlertTriangle, bg: "bg-destructive/15", text: "text-destructive", label: "Kritické" },
    warning:  { Icon: AlertTriangle, bg: "bg-warning/20",     text: "text-warning",     label: "Pozor" },
    info:     { Icon: Info,          bg: "bg-info/15",        text: "text-info",        label: "Info" },
  } as const;
  const { Icon, bg, text, label } = map[s];
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md ${bg} ${text} px-2 py-1 text-xs font-medium uppercase tracking-wide`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
  );
}

function ScanResult({ data, role, onAction, actionPending }: {
  data: ScanResponse;
  role: Role;
  onAction: (a: { to: string | null; movement: "transfer" | "service_in" | "service_out" | "scrap" }) => void;
  actionPending: boolean;
}) {
  const product = data.product;
  const next = data.next_action;
  const params = (product?.params ?? {}) as Record<string, unknown>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left column: identification (CO + KDE) */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Co to je</span>
              {product && <Badge variant="outline" className="font-mono text-[10px]">{product.type}</Badge>}
            </div>
            {product ? (
              <>
                <h2 className="text-2xl font-bold tracking-tight">
                  <Link href={`/gpc/${product.gpc_product_id}`} className="hover:underline decoration-primary/60 underline-offset-4">
                    {product.name}
                  </Link>
                </h2>
                <div className="text-sm text-muted-foreground space-x-3">
                  <span className="font-mono">{product.gid}</span>
                  <span>·</span>
                  <span>{product.manufacturer ?? "—"}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/60">
                  {Object.entries(params).slice(0, 9).map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground/80">{k.replace(/^_/, "")}</span>
                      <span className="text-sm font-medium truncate" title={String(v)}>{fmtValue(v)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <span className="text-muted-foreground">—</span>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-2">Kde je to</span>
              <div className="flex items-center gap-3">
                <StatusBadge status={data.piece.status} showLabel="cs" />
                <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
                <span className="text-lg font-semibold">
                  {data.piece.current_location
                    ? <>{data.piece.current_location.code}{data.piece.current_location.name ? <span className="text-sm font-normal text-muted-foreground"> · {data.piece.current_location.name}</span> : null}</>
                    : <span className="text-muted-foreground">neumístěno</span>}
                </span>
              </div>
            </div>
            <div className="font-mono text-xs text-muted-foreground">{data.piece.dm_code}</div>
          </CardContent>
        </Card>
      </div>

      {/* Right column: next action — hero panel */}
      <Card className={`border-2 ${next.severity === "critical" ? "border-destructive" : next.severity === "warning" ? "border-warning" : "border-info"}`}>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Co teď udělat</span>
            <SeverityBlock s={next.severity} />
          </div>
          <h3 className="text-xl font-semibold leading-tight">{next.title}</h3>

          {next.target_location && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Cíl:</span>
              <Badge className="font-mono">{next.target_location.code}</Badge>
            </div>
          )}

          <ul className="text-sm space-y-1.5 text-muted-foreground">
            {next.instructions.map((i, idx) => (
              <li key={idx} className="flex gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-50" />
                <span>{i}</span>
              </li>
            ))}
          </ul>

          {!canDo(role, "transfer") && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 pt-2 border-t border-border/60">
              <Lock className="h-3 w-3" /> Role <span className="font-mono">{role ?? "—"}</span> = read-only mode.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60">
            {data.allowed_transitions.map((t) => {
              const isScrap   = t.action === "SCRAP";
              const isWarning = t.to_location_code === "SERVICE_BIN";
              const isPrimary = t.to_location_code === next.target_location?.code;
              const allowed   = isScrap ? canDo(role, "scrap") : canDo(role, "transfer");
              const variant = isPrimary ? "default" : isScrap ? "destructive" : isWarning ? "secondary" : "outline";
              const ButtonIcon = isPrimary ? CheckCircle2 : isScrap ? AlertTriangle : isWarning ? Wrench : ArrowRight;
              return (
                <Button
                  key={t.action}
                  variant={variant as "default" | "destructive" | "secondary" | "outline"}
                  size="lg"
                  className="h-14 text-sm font-semibold"
                  disabled={actionPending || !allowed}
                  title={!allowed ? `Vyžaduje ${isScrap ? "supervisor+" : "operator+"}` : undefined}
                  onClick={() => {
                    if (t.action === "SCRAP")  onAction({ to: null, movement: "scrap" });
                    else if (t.to_location_code === "SERVICE_BIN") onAction({ to: t.to_location_code, movement: "service_out" });
                    else onAction({ to: t.to_location_code, movement: "transfer" });
                  }}
                >
                  {!allowed
                    ? <Lock className="h-4 w-4 mr-1.5" />
                    : <ButtonIcon className="h-4 w-4 mr-1.5" />}
                  {t.action.replace(/^MOVE_TO_/, "").replace(/_/g, " ")}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottom: lifecycle dump */}
      {data.piece.lifecycle && Object.keys(data.piece.lifecycle).length > 0 && (
        <details className="lg:col-span-3 group">
          <summary className="text-xs uppercase tracking-[0.2em] text-muted-foreground cursor-pointer hover:text-foreground select-none">
            Lifecycle JSONB <span className="opacity-50">(klikni pro detail)</span>
          </summary>
          <pre className="mt-2 text-[11px] bg-muted/50 border border-border p-3 rounded-md overflow-x-auto font-mono">{JSON.stringify(data.piece.lifecycle, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
