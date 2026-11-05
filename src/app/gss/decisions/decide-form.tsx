"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { RETURN_DECISION_LABELS, type ReturnDecision } from "@/lib/gss-lock";
import { decidePiece } from "../ops/actions";
import { Field, OpsSubmit } from "../ops/ops-form";

export function DecideForm({ dmCode }: { dmCode: string }) {
  const [decision, setDecision] = useState<ReturnDecision>("return_used");
  const [note, setNote] = useState("");

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Field label="Rozhodnutí">
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          value={decision}
          onChange={(e) => setDecision(e.target.value as ReturnDecision)}
        >
          {Object.entries(RETURN_DECISION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </Field>
      <Field label="Poznámka">
        <Input className="h-8 w-44" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <OpsSubmit label="Rozhodnout" run={() => decidePiece(dmCode, decision, note)} />
    </div>
  );
}
