"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { assignQid, reservePiece } from "../../ops/actions";
import { Field, OpsSubmit } from "../../ops/ops-form";

type Piece = { dm_code: string; lifecycle: { qid?: string; marked?: boolean } };

export function ReserveForm({ pieces }: { pieces: Piece[] }) {
  const [dm, setDm] = useState(pieces[0]?.dm_code ?? "");
  const [order, setOrder] = useState("");
  const [reason, setReason] = useState("");
  const [machine, setMachine] = useState("MACHINE-01");
  const [until, setUntil] = useState("");

  return (
    <div className="grid gap-3">
      <Field label="DM kus">
        <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={dm} onChange={(e) => setDm(e.target.value)}>
          {pieces.map((p) => (
            <option key={p.dm_code} value={p.dm_code}>
              {p.dm_code}{p.lifecycle.qid ? ` · ${p.lifecycle.qid}` : ""}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Zakázka"><Input value={order} onChange={(e) => setOrder(e.target.value)} /></Field>
      <Field label="Důvod"><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <Field label="Stroj"><Input value={machine} onChange={(e) => setMachine(e.target.value)} /></Field>
      <Field label="Platnost"><Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} /></Field>
      <OpsSubmit label="Rezervovat tuto položku" disabled={!dm} run={() => reservePiece({ dmCode: dm, order, reason, machine, until })} />
      <OpsSubmit label="Vygenerovat QID + označit" variant="outline" disabled={!dm} run={() => assignQid(dm, true)} />
    </div>
  );
}
