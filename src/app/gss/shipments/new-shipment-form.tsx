"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createServiceShipment } from "../ops/actions";
import { Field, OpsSubmit } from "../ops/ops-form";
import { ItemPicker, type PickerItem } from "../terminal/item-picker";

type QtyLine = { item_id: string; qty: number; label: string };

export function NewShipmentForm({ quantityItems }: { quantityItems: PickerItem[] }) {
  const [partner, setPartner] = useState("M-technologies");
  const [customer, setCustomer] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [note, setNote] = useState("");
  const [dms, setDms] = useState("");
  const [qtyLines, setQtyLines] = useState<QtyLine[]>([]);
  const [pickId, setPickId] = useState(quantityItems[0]?.id ?? "");
  const [pickQty, setPickQty] = useState("1");

  function addQtyLine() {
    const item = quantityItems.find((i) => i.id === pickId);
    const qty = Math.floor(Number(pickQty));
    if (!item || qty < 1) return;
    setQtyLines((prev) => [...prev.filter((l) => l.item_id !== item.id), { item_id: item.id, qty, label: item.label }]);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Nová zásilka do brusírny</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Partner (brusírna)"><Input value={partner} onChange={(e) => setPartner(e.target.value)} /></Field>
          <Field label="Zákazník"><Input value={customer} onChange={(e) => setCustomer(e.target.value)} /></Field>
          <Field label="Zakázka / objednávka"><Input value={orderRef} onChange={(e) => setOrderRef(e.target.value)} /></Field>
        </div>
        <Field label="DM kódy kusů (čárka nebo mezera)">
          <Input value={dms} onChange={(e) => setDms(e.target.value)} placeholder="GD-RCV-…, GD-RCV-…" />
        </Field>

        {quantityItems.length > 0 && (
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs text-muted-foreground">Množstevní řádky (položky bez DM)</p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-56 flex-1">
                <ItemPicker items={quantityItems} value={pickId} onChange={setPickId} label="Položka bez DM" />
              </div>
              <Field label="Ks">
                <Input className="h-8 w-20" type="number" min={1} value={pickQty} onChange={(e) => setPickQty(e.target.value)} />
              </Field>
              <button type="button" className="h-8 rounded-lg border px-2.5 text-sm" onClick={addQtyLine}>
                Přidat řádek
              </button>
            </div>
            {qtyLines.length > 0 && (
              <ul className="space-y-1">
                {qtyLines.map((l) => (
                  <li key={l.item_id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{l.label} · <span className="font-mono">{l.qty} ks</span></span>
                    <button
                      type="button"
                      className="text-xs underline text-muted-foreground"
                      onClick={() => setQtyLines((prev) => prev.filter((x) => x.item_id !== l.item_id))}
                    >
                      odebrat
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Field label="Poznámka"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <div>
          <OpsSubmit
            label="Založit zásilku (koncept)"
            disabled={!dms.trim() && qtyLines.length === 0}
            run={async () => {
              const r = await createServiceShipment({
                partner,
                customer,
                order_ref: orderRef,
                note,
                dm_codes: dms,
                qty_lines: qtyLines.map(({ item_id, qty }) => ({ item_id, qty })),
              });
              if (r.ok) {
                setDms("");
                setQtyLines([]);
                setNote("");
              }
              return r;
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
