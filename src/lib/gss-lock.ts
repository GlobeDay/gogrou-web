export const DOCUMENT_TYPE_LABELS = {
  supplier_delivery_note: "Dodací list dodavatele",
  supplier_invoice: "Faktura dodavatele",
  internal_receipt: "Interní příjemka",
  service_delivery_note_after_sharpening: "Servisní dodací list po broušení",
  production_return: "Návrat z výroby",
  manual_correction_inventory: "Ruční korekce / inventura",
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPE_LABELS;

export const RECEIPT_SOURCE_LABELS = {
  regular: "Běžný příjem",
  gss_order: "Příjem ze systémové objednávky GSS",
  erp_order: "Příjem z externí objednávky / ERP",
  from_sharpening: "Příjem z broušení",
  inventory: "Korekční příjem / inventura",
} as const;

export type ReceiptSource = keyof typeof RECEIPT_SOURCE_LABELS;

export const RETURN_DECISION_LABELS = {
  return_used: "Zpět na sklad jako Použitý",
  send_sharpening: "Poslat na broušení",
  scrap_carbide: "Vyřadit / odkup tvrdokovu",
  redirect_instruction: "Přesměrovat podle instrukce / jiná řezná hrana",
  temporary_block: "Dočasně zablokovat",
} as const;

export type ReturnDecision = keyof typeof RETURN_DECISION_LABELS;

export const SHIPMENT_STATUS_LABELS = {
  draft: "Koncept",
  sent_to_service: "Odesláno do servisu",
  received_by_service: "Přijato servisem",
  in_progress: "Ve zpracování",
  partial: "Částečně hotovo",
  done: "Dokončeno",
  ready: "Připraveno k odeslání",
  shipped: "Odesláno zákazníkovi",
  received_by_customer: "Přijato zákazníkem",
  closed: "Uzavřeno",
  cancelled: "Zrušeno",
} as const;

export type ShipmentStatus = keyof typeof SHIPMENT_STATUS_LABELS;

export type PieceLifecycle = {
  sharpening?: {
    cycles_done?: number;
    max_cycles?: number;
    diameter_mm?: number;
    l1_mm?: number;
    l2_mm?: number;
    performer?: string;
    date?: string;
    notes?: string;
  };
  qid?: string;
  marked?: boolean;
  reservation?: {
    active: boolean;
    order?: string;
    reason?: string;
    machine?: string;
    until?: string;
    release_code?: string;
  };
  blocked?: boolean;
  condition?: "new" | "resharpened_new" | "used";
};

export type ServiceShipment = {
  id: string;
  number: string;
  status: ShipmentStatus;
  customer: string;
  order: string;
  partner: string;
  items: Array<{ dm_code: string; note?: string }>;
  updated_at: string;
};

export type OverstockOffer = {
  item_id: string;
  qty: number;
  price: number;
  updated_at: string;
};

export function asLifecycle(value: unknown): PieceLifecycle {
  if (!value || typeof value !== "object") return {};
  return value as PieceLifecycle;
}

export function mergeLifecycle(current: unknown, patch: PieceLifecycle): PieceLifecycle {
  const base = asLifecycle(current);
  return {
    ...base,
    ...patch,
    sharpening: { ...base.sharpening, ...patch.sharpening },
    reservation: patch.reservation
      ? { ...base.reservation, ...patch.reservation }
      : base.reservation,
  };
}

export function newReleaseCode(): string {
  return `REL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function newQid(prefix: string): string {
  return `${prefix}-QID-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
