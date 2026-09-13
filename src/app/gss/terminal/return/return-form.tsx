"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { RETURN_DECISION_LABELS, type ReturnDecision } from "@/lib/gss-lock";
import { returnFromProduction } from "../../ops/actions";
import { Field, OpsSubmit } from "../../ops/ops-form";

type Piece = { dm_code: string; status: string; location: string | null };

export function ReturnForm({ pieces }: { pieces: Piece[] }) {
  const [dm, setDm] = useState(pieces[0]?.dm_code ?? "");
  const [decision, setDecision] = useState<ReturnDecision>("return_used");
  const [note, setNote] = useState("");

  return (
    <div className="grid gap-3">
      <Field label="Kus ve výrobě / na stroji">
        <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={dm} onChange={(e) => setDm(e.target.value)}>
          {pieces.map((p) => (
            <option key={p.dm_code} value={p.dm_code}>{p.dm_code} · {p.status} · {p.location ?? "—"}</option>
          ))}
        </select>
      </Field>
      <Field label="Rozhodnutí">
        <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={decision} onChange={(e) => setDecision(e.target.value as ReturnDecision)}>
          {Object.entries(RETURN_DECISION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <Field label="Poznámka">
        <Input value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <OpsSubmit label="Potvrdit návrat" disabled={!dm} run={() => returnFromProduction(dm, decision, note)} />
    </div>
  );
}
