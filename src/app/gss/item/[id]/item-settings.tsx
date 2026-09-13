"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { updateItemPolicy } from "../../ops/actions";
import { Field, OpsSubmit } from "../../ops/ops-form";

export function ItemSettings({
  itemId,
  min_qty,
  max_qty,
  reorder_point,
  notes,
  canAct,
}: {
  itemId: string;
  min_qty: number | null;
  max_qty: number | null;
  reorder_point: number | null;
  notes: string | null;
  canAct: boolean;
}) {
  const [min, setMin] = useState(String(min_qty ?? ""));
  const [max, setMax] = useState(String(max_qty ?? ""));
  const [reorder, setReorder] = useState(String(reorder_point ?? ""));
  const [note, setNote] = useState(notes ?? "");

  if (!canAct) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <Field label="Min"><Input type="number" value={min} onChange={(e) => setMin(e.target.value)} /></Field>
      <Field label="Reorder"><Input type="number" value={reorder} onChange={(e) => setReorder(e.target.value)} /></Field>
      <Field label="Max"><Input type="number" value={max} onChange={(e) => setMax(e.target.value)} /></Field>
      <Field label="Poznámka"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <OpsSubmit
        label="Uložit nastavení"
        variant="outline"
        run={() => updateItemPolicy({
          itemId,
          min_qty: min === "" ? null : Number(min),
          max_qty: max === "" ? null : Number(max),
          reorder_point: reorder === "" ? null : Number(reorder),
          notes: note,
        })}
      />
    </div>
  );
}
