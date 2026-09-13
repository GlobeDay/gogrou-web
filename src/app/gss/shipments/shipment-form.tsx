"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SHIPMENT_STATUS_LABELS, type ShipmentStatus } from "@/lib/gss-lock";
import { saveShipment } from "../ops/actions";
import { Field, OpsSubmit } from "../ops/ops-form";

export function ShipmentForm() {
  const [number, setNumber] = useState("");
  const [status, setStatus] = useState<ShipmentStatus>("draft");
  const [customer, setCustomer] = useState("");
  const [order, setOrder] = useState("");
  const [dms, setDms] = useState("");

  return (
    <div className="grid gap-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Číslo zásilky / DL"><Input value={number} onChange={(e) => setNumber(e.target.value)} /></Field>
        <Field label="Stav">
          <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus)}>
            {Object.entries(SHIPMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Zákazník"><Input value={customer} onChange={(e) => setCustomer(e.target.value)} /></Field>
      <Field label="Objednávka"><Input value={order} onChange={(e) => setOrder(e.target.value)} /></Field>
      <Field label="DM kódy (čárka nebo mezera)"><Input value={dms} onChange={(e) => setDms(e.target.value)} /></Field>
      <OpsSubmit
        label="Uložit zásilku"
        run={() => saveShipment({ number, status, customer, order, dm_codes: dms })}
      />
    </div>
  );
}
