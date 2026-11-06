"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { DOCUMENT_TYPE_LABELS, RECEIPT_SOURCE_LABELS, type TrackingMode } from "@/lib/gss-lock";
import { receiveBatch } from "../../ops/actions";
import { Field, OpsSubmit } from "../../ops/ops-form";
import { ItemPicker } from "../item-picker";

type Item = {
  id: string;
  tracking_mode: TrackingMode;
  qty_on_hand: number;
  product: { name: string; gid: string; manufacturer?: string | null };
};

export function ReceiveForm({ items }: { items: Item[] }) {
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const [source, setSource] = useState<keyof typeof RECEIPT_SOURCE_LABELS>("regular");
  const [documentType, setDocumentType] = useState<keyof typeof DOCUMENT_TYPE_LABELS>("internal_receipt");
  const [docNo, setDocNo] = useState("");
  const [allowOverMax, setAllowOverMax] = useState(false);
  const item = useMemo(() => items.find((it) => it.id === itemId), [items, itemId]);
  const pickerItems = useMemo(
    () =>
      items.map((it) => ({
        id: it.id,
        label: `${it.product.name} · ${it.product.gid}${it.tracking_mode === "quantity" ? " · bez DM" : ""}`,
        keywords: it.product.manufacturer ?? "",
      })),
    [items],
  );

  return (
    <div className="grid gap-3">
      <ItemPicker items={pickerItems} value={itemId} onChange={setItemId} />
      <Field label="Množství">
        <Input type="number" min={1} max={50} value={qty} onChange={(e) => setQty(e.target.value)} />
      </Field>
      {item && (
        <p className="text-xs text-muted-foreground">
          {item.tracking_mode === "quantity"
            ? `Množstevní položka — příjem jen navýší stav (teď ${item.qty_on_hand} ks), DM kódy nevznikají.`
            : "DM položka — každý přijatý kus dostane vlastní DM kód a QID."}
        </p>
      )}
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
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <input type="checkbox" checked={allowOverMax} onChange={(e) => setAllowOverMax(e.target.checked)} />
        Povolit příjem nad Max (s auditem)
      </label>
      {!docNo.trim() && (
        <p className="text-2xs text-muted-foreground">Bez čísla dokladu bude příjemka ve stavu „čeká na kontrolu“.</p>
      )}
      <OpsSubmit
        label="Naskladnit tuto položku"
        disabled={!itemId}
        run={() => receiveBatch({
          itemId,
          qty: Number(qty),
          source,
          document_type: documentType,
          doc_no: docNo,
          allow_over_max: allowOverMax,
        })}
      />
    </div>
  );
}
