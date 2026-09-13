"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { saveOverstockOffer } from "../ops/actions";
import { Field, OpsSubmit } from "../ops/ops-form";

type Item = { id: string; product: { name: string; gid: string } };

export function OverstockForm({ items }: { items: Item[] }) {
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("0");
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Položka">
        <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={itemId} onChange={(e) => setItemId(e.target.value)}>
          {items.map((it) => <option key={it.id} value={it.id}>{it.product.name}</option>)}
        </select>
      </Field>
      <Field label="Množství"><Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
      <Field label="Cena / ks"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
      <OpsSubmit label="Uložit nadnormativu" disabled={!itemId} run={() => saveOverstockOffer(itemId, Number(qty), Number(price))} />
    </div>
  );
}
