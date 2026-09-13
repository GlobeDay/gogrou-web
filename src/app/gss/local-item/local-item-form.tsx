"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { createLocalItem } from "../ops/actions";
import { Field, OpsSubmit } from "../ops/ops-form";

export function LocalItemForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [min, setMin] = useState("0");
  const [max, setMax] = useState("0");
  const [reorder, setReorder] = useState("0");
  const [notes, setNotes] = useState("Lokální nevalidovaná položka");

  return (
    <div className="grid gap-3">
      <Field label="Název"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Výrobce"><Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Min"><Input type="number" value={min} onChange={(e) => setMin(e.target.value)} /></Field>
        <Field label="Max"><Input type="number" value={max} onChange={(e) => setMax(e.target.value)} /></Field>
        <Field label="Reorder"><Input type="number" value={reorder} onChange={(e) => setReorder(e.target.value)} /></Field>
      </div>
      <Field label="Poznámka"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <OpsSubmit
        label="Přidat lokální položku"
        run={async () => {
          const result = await createLocalItem({
            name,
            manufacturer,
            min_qty: Number(min) || null,
            max_qty: Number(max) || null,
            reorder_point: Number(reorder) || null,
            notes,
          });
          if (result.ok && result.id) router.push(`/gss/item/${result.id}`);
          return result;
        }}
      />
    </div>
  );
}
