"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { TRACKING_MODE_LABELS, type TrackingMode } from "@/lib/gss-lock";
import { updateItemPolicy } from "../../ops/actions";
import { Field, OpsSubmit } from "../../ops/ops-form";

export function ItemSettings({
  itemId,
  min_qty,
  max_qty,
  reorder_point,
  notes,
  pack_size,
  supplier_primary,
  supplier_secondary,
  tracking_mode,
  canAct,
}: {
  itemId: string;
  min_qty: number | null;
  max_qty: number | null;
  reorder_point: number | null;
  notes: string | null;
  pack_size: number | null;
  supplier_primary: string | null;
  supplier_secondary: string | null;
  tracking_mode: TrackingMode;
  canAct: boolean;
}) {
  const [min, setMin] = useState(String(min_qty ?? ""));
  const [max, setMax] = useState(String(max_qty ?? ""));
  const [reorder, setReorder] = useState(String(reorder_point ?? ""));
  const [note, setNote] = useState(notes ?? "");
  const [pack, setPack] = useState(String(pack_size ?? ""));
  const [supplier1, setSupplier1] = useState(supplier_primary ?? "");
  const [supplier2, setSupplier2] = useState(supplier_secondary ?? "");
  const [mode, setMode] = useState<TrackingMode>(tracking_mode);

  if (!canAct) return null;

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Min"><Input type="number" value={min} onChange={(e) => setMin(e.target.value)} /></Field>
        <Field label="Reorder"><Input type="number" value={reorder} onChange={(e) => setReorder(e.target.value)} /></Field>
        <Field label="Max"><Input type="number" value={max} onChange={(e) => setMax(e.target.value)} /></Field>
        <Field label="Balení (pack size)"><Input type="number" value={pack} onChange={(e) => setPack(e.target.value)} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Primární dodavatel"><Input value={supplier1} onChange={(e) => setSupplier1(e.target.value)} /></Field>
        <Field label="Sekundární dodavatel"><Input value={supplier2} onChange={(e) => setSupplier2(e.target.value)} /></Field>
        <Field label="Režim sledování">
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as TrackingMode)}
          >
            {Object.entries(TRACKING_MODE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
      </div>
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
          pack_size: pack === "" ? null : Number(pack),
          supplier_primary: supplier1.trim() || null,
          supplier_secondary: supplier2.trim() || null,
          tracking_mode: mode,
        })}
      />
    </div>
  );
}
