"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { issuePieces, issueReserved } from "../../ops/actions";
import type { PieceLifecycle } from "@/lib/gss-lock";
import { Field, OpsSubmit } from "../../ops/ops-form";

type Item = { id: string; product: { name: string; gid: string } };
type Piece = { dm_code: string; item_id: string; lifecycle: PieceLifecycle };

export function IssueForm({ items, pieces }: { items: Item[]; pieces: Piece[] }) {
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [release, setRelease] = useState("");
  const available = useMemo(
    () => pieces.filter((p) => p.item_id === itemId && !p.lifecycle.reservation?.active && !p.lifecycle.blocked),
    [pieces, itemId],
  );
  const reserved = useMemo(
    () => pieces.filter((p) => p.item_id === itemId && p.lifecycle.reservation?.active),
    [pieces, itemId],
  );

  function toggle(dm: string) {
    setSelected((cur) => (cur.includes(dm) ? cur.filter((x) => x !== dm) : [...cur, dm]));
  }

  return (
    <div className="grid gap-4">
      <Field label="Položka">
        <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={itemId} onChange={(e) => { setItemId(e.target.value); setSelected([]); }}>
          {items.map((it) => <option key={it.id} value={it.id}>{it.product.name}</option>)}
        </select>
      </Field>
      <div className="grid gap-1">
        <span className="text-xs text-muted-foreground">Volné kusy</span>
        {available.map((p) => (
          <label key={p.dm_code} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.includes(p.dm_code)} onChange={() => toggle(p.dm_code)} />
            <span className="font-mono text-xs">{p.dm_code}</span>
          </label>
        ))}
        {available.length === 0 && <p className="text-xs text-muted-foreground">Žádný volný kus na skladě.</p>}
      </div>
      <OpsSubmit label="Vydat vybrané kusy" disabled={selected.length === 0} run={() => issuePieces(itemId, selected)} />

      {reserved.length > 0 && (
        <div className="grid gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Rezervované</span>
          {reserved.map((p) => (
            <div key={p.dm_code} className="grid gap-2">
              <div className="font-mono text-xs">{p.dm_code} · {p.lifecycle.reservation?.order}</div>
              <Field label="Release kód">
                <Input value={release} onChange={(e) => setRelease(e.target.value)} />
              </Field>
              <OpsSubmit
                label="Vydat rezervovaný kus"
                variant="outline"
                disabled={!release}
                run={() => issueReserved(p.dm_code, release)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
