"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import type { PieceLifecycle } from "@/lib/gss-lock";
import { assignQid, receiveFromSharpening, saveServiceParams, sendToSharpening } from "../ops/actions";
import { Field, OpsSubmit } from "../ops/ops-form";

type Piece = {
  dm_code: string;
  item_id: string;
  status: string;
  location: string | null;
  lifecycle: PieceLifecycle;
};

export function ServiceForm({ pieces }: { pieces: Piece[] }) {
  const [dm, setDm] = useState(pieces[0]?.dm_code ?? "");
  const selected = useMemo(() => pieces.find((p) => p.dm_code === dm), [pieces, dm]);
  const sh = selected?.lifecycle.sharpening;
  const [diameter, setDiameter] = useState(String(sh?.diameter_mm ?? ""));
  const [l1, setL1] = useState(String(sh?.l1_mm ?? ""));
  const [l2, setL2] = useState(String(sh?.l2_mm ?? ""));
  const [performer, setPerformer] = useState(sh?.performer ?? "M-technologies");
  const [date, setDate] = useState(sh?.date ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(sh?.notes ?? "");

  return (
    <div className="grid gap-3">
      <Field label="DM / QID">
        <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={dm} onChange={(e) => setDm(e.target.value)}>
          {pieces.map((p) => (
            <option key={p.dm_code} value={p.dm_code}>
              {p.dm_code}{p.lifecycle.qid ? ` · ${p.lifecycle.qid}` : ""} · {p.status}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="D (mm)"><Input value={diameter} onChange={(e) => setDiameter(e.target.value)} /></Field>
        <Field label="L1 (mm)"><Input value={l1} onChange={(e) => setL1(e.target.value)} /></Field>
        <Field label="L2 (mm)"><Input value={l2} onChange={(e) => setL2(e.target.value)} /></Field>
      </div>
      <Field label="Provedl"><Input value={performer} onChange={(e) => setPerformer(e.target.value)} /></Field>
      <Field label="Datum"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Poznámka"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <OpsSubmit
        label="Uložit změny"
        disabled={!dm}
        run={() => saveServiceParams({
          dmCode: dm, diameter_mm: diameter, l1_mm: l1, l2_mm: l2, performer, date, notes,
        })}
      />
      <div className="flex flex-wrap gap-2">
        <OpsSubmit label="Vygenerovat QID" variant="outline" disabled={!dm} run={() => assignQid(dm, true)} />
        <OpsSubmit label="Potvrdit příjem z broušení" variant="secondary" disabled={!dm || selected?.status !== "in_service"} run={() => receiveFromSharpening(dm)} />
        {selected && (
          <OpsSubmit
            label="Odeslat na broušení"
            variant="outline"
            disabled={selected.status === "in_service" || selected.status === "scrapped"}
            run={() => sendToSharpening(dm)}
          />
        )}
        {dm && (
          <Link href={`/gss/label/${encodeURIComponent(dm)}`} className="inline-flex h-8 items-center rounded-lg border px-2.5 text-sm">
            Zobrazit štítek
          </Link>
        )}
      </div>
    </div>
  );
}
