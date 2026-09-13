"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DOCUMENT_TYPE_LABELS, RECEIPT_SOURCE_LABELS } from "@/lib/gss-lock";
import { receiveBatch } from "../../ops/actions";
import { Field, OpsSubmit } from "../../ops/ops-form";

type Item = { id: string; product: { name: string; gid: string } };

export function ReceiveForm({ items }: { items: Item[] }) {
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const [source, setSource] = useState<keyof typeof RECEIPT_SOURCE_LABELS>("regular");
  const [documentType, setDocumentType] = useState<keyof typeof DOCUMENT_TYPE_LABELS>("internal_receipt");
  const [docNo, setDocNo] = useState("");

  return (
    <div className="grid gap-3">
      <Field label="Položka">
        <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={itemId} onChange={(e) => setItemId(e.target.value)}>
          {items.map((it) => (
            <option key={it.id} value={it.id}>{it.product.name} · {it.product.gid}</option>
          ))}
        </select>
      </Field>
      <Field label="Množství">
        <Input type="number" min={1} max={50} value={qty} onChange={(e) => setQty(e.target.value)} />
      </Field>
      <Field label="Zdroj příjmu">
        <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
          {Object.entries(RECEIPT_SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <Field label="Typ dokladu">
        <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={documentType} onChange={(e) => setDocumentType(e.target.value as typeof documentType)}>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <Field label="Číslo dokladu">
        <Input value={docNo} onChange={(e) => setDocNo(e.target.value)} />
      </Field>
      <OpsSubmit
        label="Naskladnit tuto položku"
        disabled={!itemId}
        run={() => receiveBatch({
          itemId,
          qty: Number(qty),
          source,
          document_type: documentType,
          doc_no: docNo,
        })}
      />
    </div>
  );
}
