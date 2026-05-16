"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { importPieces, type ImportResult } from "./actions";

interface ItemRow { id: string; gid: string; name: string; type: string; }
interface LocationRow { code: string; name: string; }

const STATUS_OPTIONS = ["new", "in_stock", "in_preset"] as const;

export function ImportClient({ items, locations, tenantPrefix }: {
  items: ItemRow[];
  locations: LocationRow[];
  tenantPrefix: string;
}) {
  const [itemId, setItemId]       = useState<string>(items[0]?.id ?? "");
  const [status, setStatus]       = useState<typeof STATUS_OPTIONS[number]>("new");
  const [locCode, setLocCode]     = useState<string>(locations.find((l) => l.code === "MAIN")?.code ?? "");
  const [text, setText]           = useState("");
  const [result, setResult]       = useState<ImportResult | null>(null);
  const [pending, start]          = useTransition();

  const dmCodes = text
    .split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const unique  = [...new Set(dmCodes)];
  const dupes   = dmCodes.length - unique.length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemId || unique.length === 0) return;
    start(async () => {
      try {
        const r = await importPieces({
          item_id:               itemId,
          tenant_prefix:         tenantPrefix,
          default_status:        status,
          default_location_code: locCode || null,
          dm_codes:              unique,
        });
        setResult(r);
        toast.success(`Naimportováno ${r.inserted} / ${r.total}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Cíl</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Label className="text-xs">Skladová karta</Label>
            <Select value={itemId} onValueChange={(v) => v && setItemId(v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {items.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    <span className="font-medium">{i.name}</span>
                    <span className="font-mono text-xs ml-2 opacity-60">{i.gid}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Default status</Label>
            <Select value={status} onValueChange={(v) => v && setStatus(v as typeof STATUS_OPTIONS[number])}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Default lokace</Label>
            <Select value={locCode || "__none__"} onValueChange={(v) => v && setLocCode(v === "__none__" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">(žádná)</SelectItem>
                {locations.map((l) => <SelectItem key={l.code} value={l.code}>
                  <span className="font-mono text-xs mr-2">{l.code}</span>{l.name}
                </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex justify-between items-baseline">
            <span>DM kódy</span>
            <span className="text-xs font-normal text-muted-foreground">
              {unique.length} unikátních
              {dupes > 0 && <span className="text-yellow-600 ml-2">({dupes} duplicit ignorováno)</span>}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"DM-...-1\nDM-...-2\nDM-...-3"}
            rows={10}
            className="w-full font-mono text-sm rounded-md border border-input bg-background px-3 py-2"
          />
          <p className="text-xs text-muted-foreground mt-1">Jeden DM kód na řádek. Prázdné řádky a duplicity se přeskočí.</p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending || !itemId || unique.length === 0}>
          {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
          Importovat {unique.length} kusů
        </Button>
      </div>

      {result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Výsledek: <Badge>{result.inserted}</Badge> / {result.total} úspěšně
              {result.total - result.inserted > 0 && <Badge variant="destructive" className="ml-2">{result.total - result.inserted} chyb</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto border rounded-md">
              {result.rows.map((r) => (
                <div key={r.dm_code} className="flex items-center gap-2 px-3 py-1.5 text-xs border-b last:border-0">
                  {r.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                  <span className="font-mono flex-1">{r.dm_code}</span>
                  {!r.ok && <span className="text-destructive">{r.error}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
