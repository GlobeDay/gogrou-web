/**
 * SmartSplit — DEMO data.
 * Skupinové nákupy a cenové akce; data jsou ilustrativní (žádná DB tabulka zatím neexistuje).
 * Až vznikne backend (ss_campaigns / ss_commitments), tento soubor se nahradí Supabase dotazy.
 */

export interface SsTier {
  minQty: number;
  discountPct: number;
}

export type SsStatus = "open" | "closing" | "fulfilled" | "draft";

export interface SsCampaign {
  id: string;
  title: string;
  productName: string;
  manufacturer: string;
  partNo: string;
  /** Katalogová cena za kus v Kč */
  unitPrice: number;
  tiers: SsTier[];
  targetQty: number;
  committedQty: number;
  participants: number;
  deadline: string; // ISO
  status: SsStatus;
}

export const SS_STATUS_META: Record<SsStatus, { label: string; variant: "success" | "warning" | "info" | "neutral" }> = {
  open:      { label: "Otevřená",     variant: "success" },
  closing:   { label: "Poslední dny", variant: "warning" },
  fulfilled: { label: "Naplněno",     variant: "info" },
  draft:     { label: "Připravujeme", variant: "neutral" },
};

export const SS_CAMPAIGNS: SsCampaign[] = [
  {
    id: "SS-2026-014",
    title: "Vrtáky Walter Titex DC170",
    productName: "DC170 SC vrták Ø8,5 × 5D",
    manufacturer: "Walter",
    partNo: "DC170-05-08.500A1-WJ30EJ",
    unitPrice: 1890,
    tiers: [
      { minQty: 50, discountPct: 6 },
      { minQty: 100, discountPct: 12 },
      { minQty: 200, discountPct: 18 },
    ],
    targetQty: 200,
    committedQty: 148,
    participants: 9,
    deadline: "2026-08-29T22:00:00Z",
    status: "open",
  },
  {
    id: "SS-2026-015",
    title: "Frézy Gühring RF100 U",
    productName: "RF100 U stopková fréza Ø10",
    manufacturer: "Gühring",
    partNo: "6737-10.000",
    unitPrice: 2450,
    tiers: [
      { minQty: 30, discountPct: 5 },
      { minQty: 60, discountPct: 10 },
      { minQty: 120, discountPct: 16 },
    ],
    targetQty: 120,
    committedQty: 112,
    participants: 12,
    deadline: "2026-08-18T22:00:00Z",
    status: "closing",
  },
  {
    id: "SS-2026-012",
    title: "Destičky Walter Tigertec WSM35S",
    productName: "VBD ADMT120408R-F56",
    manufacturer: "Walter",
    partNo: "ADMT120408R-F56 WSM35S",
    unitPrice: 315,
    tiers: [
      { minQty: 500, discountPct: 8 },
      { minQty: 1000, discountPct: 14 },
      { minQty: 2000, discountPct: 20 },
    ],
    targetQty: 2000,
    committedQty: 2000,
    participants: 17,
    deadline: "2026-08-05T22:00:00Z",
    status: "fulfilled",
  },
  {
    id: "SS-2026-016",
    title: "Závitníky Emuge Rekord 1B",
    productName: "Rekord 1B-M8 HSSE-V3",
    manufacturer: "Emuge",
    partNo: "B0201000.0080",
    unitPrice: 1120,
    tiers: [
      { minQty: 40, discountPct: 5 },
      { minQty: 80, discountPct: 9 },
      { minQty: 160, discountPct: 14 },
    ],
    targetQty: 160,
    committedQty: 36,
    participants: 3,
    deadline: "2026-09-12T22:00:00Z",
    status: "open",
  },
  {
    id: "SS-2026-017",
    title: "Upínače Schunk Tendo E compact",
    productName: "Tendo E compact HSK-A63 Ø20",
    manufacturer: "Schunk",
    partNo: "0206130",
    unitPrice: 8900,
    tiers: [
      { minQty: 10, discountPct: 4 },
      { minQty: 20, discountPct: 8 },
      { minQty: 40, discountPct: 12 },
    ],
    targetQty: 40,
    committedQty: 0,
    participants: 0,
    deadline: "2026-09-30T22:00:00Z",
    status: "draft",
  },
];

/** Aktuálně dosažený slevový tier podle nasbíraného množství (nebo null). */
export function currentTier(c: SsCampaign): SsTier | null {
  let hit: SsTier | null = null;
  for (const t of c.tiers) if (c.committedQty >= t.minQty) hit = t;
  return hit;
}

/** Další tier, na který kampaň může dosáhnout (nebo null, když je na maximu). */
export function nextTier(c: SsCampaign): SsTier | null {
  return c.tiers.find((t) => c.committedQty < t.minQty) ?? null;
}

/** Odhad úspory v Kč při aktuálním tieru. */
export function estimatedSavings(c: SsCampaign): number {
  const t = currentTier(c);
  return t ? Math.round(c.committedQty * c.unitPrice * (t.discountPct / 100)) : 0;
}

export const fmtCzk = (n: number) =>
  new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(n);
