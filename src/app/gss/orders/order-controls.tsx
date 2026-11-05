"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DOCUMENT_TYPE_LABELS } from "@/lib/gss-lock";
import { createOrdersFromLowStock, receiveOrderLine, setOrderStatus } from "../ops/actions";
import { Field, OpsSubmit } from "../ops/ops-form";

export function CreateOrdersButton() {
  return (
    <OpsSubmit
      label="Vytvořit návrhy podle dodavatele"
      run={() => createOrdersFromLowStock()}
    />
  );
}

export function OrderStatusButtons({ orderId, status }: { orderId: string; status: string }) {
  return (
    <div className="flex gap-2">
      {status === "draft" && (
        <OpsSubmit label="Odeslat dodavateli" run={() => setOrderStatus(orderId, "ordered")} />
      )}
      {(status === "draft" || status === "ordered" || status === "partially_received") && (
        <OpsSubmit label="Zrušit objednávku" variant="outline" run={() => setOrderStatus(orderId, "cancelled")} />
      )}
    </div>
  );
}

export function ReceiveLineForm({
  lineId,
  remaining,
}: {
  lineId: string;
  remaining: number;
}) {
  const [qty, setQty] = useState(String(Math.max(remaining, 1)));
  const [documentType, setDocumentType] = useState<keyof typeof DOCUMENT_TYPE_LABELS>("supplier_delivery_note");
  const [docNo, setDocNo] = useState("");
  const [allowOverReceipt, setAllowOverReceipt] = useState(false);
  const [allowOverMax, setAllowOverMax] = useState(false);
  const overReceipt = Number(qty) > remaining;

  return (
    <div className="grid gap-2 sm:grid-cols-[90px_1fr_1fr_auto] sm:items-end">
      <Field label="Množství">
        <Input type="number" min={1} max={50} value={qty} onChange={(e) => setQty(e.target.value)} />
      </Field>
      <Field label="Typ dokladu">
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as typeof documentType)}
        >
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <Field label="Číslo dokladu">
        <Input value={docNo} onChange={(e) => setDocNo(e.target.value)} />
      </Field>
      <OpsSubmit
        label="Přijmout"
        disabled={!qty}
        run={() => receiveOrderLine({
          lineId,
          qty: Number(qty),
          document_type: documentType,
          doc_no: docNo,
          allow_over_receipt: allowOverReceipt,
          allow_over_max: allowOverMax,
        })}
      />
      <div className="flex flex-wrap gap-4 sm:col-span-4 text-xs text-muted-foreground">
        {overReceipt && (
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={allowOverReceipt} onChange={(e) => setAllowOverReceipt(e.target.checked)} />
            Povolit over-receipt (nad objednané množství, s auditem)
          </label>
        )}
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={allowOverMax} onChange={(e) => setAllowOverMax(e.target.checked)} />
          Povolit příjem nad Max
        </label>
        {!docNo.trim() && <span>Bez čísla dokladu bude příjemka ve stavu „čeká na kontrolu“.</span>}
      </div>
    </div>
  );
}
