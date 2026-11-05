"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CONDITION_LABELS, type PieceCondition, type PieceLifecycle } from "@/lib/gss-lock";
import {
  receivePiecesFromSharpening,
  receiveQuantityFromService,
  sendPiecesToSharpening,
  sendQuantityToService,
} from "../ops/actions";
import { Field, OpsSubmit } from "../ops/ops-form";
import { ItemPicker, type PickerItem } from "../terminal/item-picker";

export type TerminalItem = PickerItem & {
  tracking_mode: string;
  qty_on_hand: number;
};

export type TerminalPiece = {
  dm_code: string;
  item_id: string;
  status: string;
  condition: string | null;
  location: string | null;
  lifecycle: PieceLifecycle;
};

function PieceRow({
  piece,
  checked,
  onToggle,
}: {
  piece: TerminalPiece;
  checked: boolean;
  onToggle: () => void;
}) {
  const sh = piece.lifecycle.sharpening;
  const cycles = sh?.max_cycles ? `${sh.cycles_done ?? 0}/${sh.max_cycles}` : null;
  return (
    <label className="flex items-center gap-2 py-1.5 text-sm cursor-pointer">
      <input type="checkbox" className="accent-primary" checked={checked} onChange={onToggle} />
      <span className="font-mono">{piece.dm_code}</span>
      {piece.condition && (
        <Badge variant="outline" className="text-2xs">
          {CONDITION_LABELS[piece.condition as PieceCondition] ?? piece.condition}
        </Badge>
      )}
      {cycles && <Badge variant="secondary" className="font-mono text-2xs">brusy {cycles}</Badge>}
      <span className="ml-auto text-xs text-muted-foreground">{piece.location ?? "—"}</span>
    </label>
  );
}

/**
 * Product-centric servisní terminál (P5): vyber položku, hromadně odešli
 * vybrané kusy na broušení / přijmi je zpět; non-DM položky množstevně.
 */
export function ServiceTerminal({ items, pieces }: { items: TerminalItem[]; pieces: TerminalPiece[] }) {
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [outSel, setOutSel] = useState<Set<string>>(new Set());
  const [inSel, setInSel] = useState<Set<string>>(new Set());
  const [qtyOut, setQtyOut] = useState("1");
  const [qtyIn, setQtyIn] = useState("1");

  const item = useMemo(() => items.find((i) => i.id === itemId), [items, itemId]);
  const itemPieces = useMemo(() => pieces.filter((p) => p.item_id === itemId), [pieces, itemId]);
  const sendable = itemPieces.filter((p) => p.status === "in_stock" && !p.lifecycle.reservation?.active && !p.lifecycle.blocked);
  const inService = itemPieces.filter((p) => p.status === "in_service");
  const quantityMode = item?.tracking_mode === "quantity";

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, dm: string) {
    const next = new Set(set);
    if (next.has(dm)) next.delete(dm);
    else next.add(dm);
    setter(next);
  }

  function selectItem(id: string) {
    setItemId(id);
    setOutSel(new Set());
    setInSel(new Set());
  }

  return (
    <div className="space-y-3">
      <ItemPicker items={items} value={itemId} onChange={selectItem} label="Položka (product-centric)" />

      {quantityMode && item && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Množstevní servis (bez DM) <span className="font-normal text-muted-foreground">· skladem {item.qty_on_hand} ks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <Field label="Odeslat (ks)">
              <Input className="h-8 w-24" type="number" min={1} value={qtyOut} onChange={(e) => setQtyOut(e.target.value)} />
            </Field>
            <OpsSubmit
              label="Odeslat na broušení"
              variant="outline"
              disabled={!itemId || Number(qtyOut) < 1}
              run={() => sendQuantityToService(itemId, Number(qtyOut))}
            />
            <Field label="Přijmout (ks)">
              <Input className="h-8 w-24" type="number" min={1} value={qtyIn} onChange={(e) => setQtyIn(e.target.value)} />
            </Field>
            <OpsSubmit
              label="Přijmout z broušení"
              variant="secondary"
              disabled={!itemId || Number(qtyIn) < 1}
              run={() => receiveQuantityFromService(itemId, Number(qtyIn))}
            />
          </CardContent>
        </Card>
      )}

      {!quantityMode && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Na skladě — k odeslání <span className="font-normal text-muted-foreground">({sendable.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {sendable.map((p) => (
                  <PieceRow key={p.dm_code} piece={p} checked={outSel.has(p.dm_code)} onToggle={() => toggle(outSel, setOutSel, p.dm_code)} />
                ))}
                {sendable.length === 0 && <p className="py-3 text-sm text-muted-foreground">Žádné volné kusy na skladě.</p>}
              </div>
              {sendable.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="text-xs underline text-muted-foreground"
                    onClick={() => setOutSel(outSel.size === sendable.length ? new Set() : new Set(sendable.map((p) => p.dm_code)))}
                  >
                    {outSel.size === sendable.length ? "Zrušit výběr" : "Vybrat vše"}
                  </button>
                  <OpsSubmit
                    label={`Odeslat vybrané na broušení (${outSel.size})`}
                    disabled={outSel.size === 0}
                    run={async () => {
                      const r = await sendPiecesToSharpening([...outSel]);
                      if (r.ok) setOutSel(new Set());
                      return r;
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Na broušení — k příjmu <span className="font-normal text-muted-foreground">({inService.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {inService.map((p) => (
                  <PieceRow key={p.dm_code} piece={p} checked={inSel.has(p.dm_code)} onToggle={() => toggle(inSel, setInSel, p.dm_code)} />
                ))}
                {inService.length === 0 && <p className="py-3 text-sm text-muted-foreground">Nic není na broušení.</p>}
              </div>
              {inService.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="text-xs underline text-muted-foreground"
                    onClick={() => setInSel(inSel.size === inService.length ? new Set() : new Set(inService.map((p) => p.dm_code)))}
                  >
                    {inSel.size === inService.length ? "Zrušit výběr" : "Vybrat vše"}
                  </button>
                  <OpsSubmit
                    label={`Přijmout vybrané (${inSel.size})`}
                    variant="secondary"
                    disabled={inSel.size === 0}
                    run={async () => {
                      const r = await receivePiecesFromSharpening([...inSel]);
                      if (r.ok) setInSel(new Set());
                      return r;
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
