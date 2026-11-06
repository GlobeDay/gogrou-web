"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { searchGss, type GssSearchResponse } from "@/lib/api";

const EMPTY: GssSearchResponse = { items: [], catalog: [], pieces: [], external: [] };

export function SearchClient({ initialQuery }: { initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const [result, setResult] = useState<GssSearchResponse>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const trimmed = q.trim();
    const mySeq = ++seq.current;
    const t = setTimeout(async () => {
      if (seq.current !== mySeq) return;
      if (trimmed.length < 2) {
        setResult(EMPTY);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const r = await searchGss(trimmed);
        if (seq.current !== mySeq) return;
        setResult(r);
        setError(null);
      } catch (e) {
        if (seq.current !== mySeq) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (seq.current === mySeq) setLoading(false);
      }
    }, trimmed.length < 2 ? 0 : 300);
    return () => clearTimeout(t);
  }, [q]);

  const total = result.items.length + result.catalog.length + result.pieces.length + result.external.length;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        <Input
          autoFocus
          className="pl-9"
          placeholder="Název, výrobce, obj. číslo, GID, GTIN, QID, DM, externí ID, parametry…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">Chyba: {error}</p>}
      {q.trim().length >= 2 && !loading && !error && total === 0 && (
        <p className="text-sm text-muted-foreground">Nic nenalezeno pro „{q.trim()}“.</p>
      )}

      {result.items.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Skladové položky</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {result.items.map((it) => (
              <Link key={it.item_id} href={`/gss/item/${it.item_id}`} className="flex items-center justify-between gap-3 py-2 hover:bg-accent/40 -mx-2 px-2 rounded">
                <div>
                  <div className="font-medium">
                    {it.name}
                    {it.is_local && <Badge variant="destructive" className="ml-2 text-2xs">LOKÁLNÍ</Badge>}
                    {it.via_params && <Badge variant="secondary" className="ml-2 text-2xs">parametr</Badge>}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{it.gid}{it.manufacturer ? ` · ${it.manufacturer}` : ""}</div>
                </div>
                <Badge variant="outline" className="font-mono text-xs shrink-0">{it.type}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {result.pieces.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Kusy (DM / QID)</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {result.pieces.map((p) => (
              <Link key={p.dm_code} href={`/gss/piece/${encodeURIComponent(p.dm_code)}`} className="flex items-center justify-between gap-3 py-2 hover:bg-accent/40 -mx-2 px-2 rounded">
                <div>
                  <div className="font-mono text-sm">{p.dm_code}</div>
                  <div className="text-xs text-muted-foreground">{p.name}{p.qid ? ` · ${p.qid}` : ""}</div>
                </div>
                <Badge variant="outline" className="font-mono text-xs shrink-0">{p.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {result.external.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Externí identifikátory</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {result.external.map((e) => (
              <Link key={`${e.system}-${e.value}`} href={`/gss/item/${e.item_id}`} className="flex items-center justify-between gap-3 py-2 hover:bg-accent/40 -mx-2 px-2 rounded">
                <div>
                  <div className="font-mono text-sm">{e.value}</div>
                  <div className="text-xs text-muted-foreground">{e.name}</div>
                </div>
                <Badge variant="secondary" className="font-mono text-xs shrink-0">{e.system}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {result.catalog.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Katalog GPC <span className="font-normal text-muted-foreground">(nepřevzato do skladu)</span></CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {result.catalog.map((p) => (
              <Link key={p.product_id} href={`/gpc/${p.product_id}`} className="flex items-center justify-between gap-3 py-2 hover:bg-accent/40 -mx-2 px-2 rounded">
                <div>
                  <div className="font-medium">
                    {p.name}
                    {p.via_params && <Badge variant="secondary" className="ml-2 text-2xs">parametr</Badge>}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{p.gid}{p.manufacturer ? ` · ${p.manufacturer}` : ""}</div>
                </div>
                <Badge variant="outline" className="font-mono text-xs shrink-0">{p.type}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
