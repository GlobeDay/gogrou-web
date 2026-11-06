/**
 * Klient pro interní /api routes (scan, move).
 * Cookies → session → RLS — žádný JWT header explicitně.
 *
 * Defaultně volá relativní URL (same-origin). Pokud potřebuješ proxy přes
 * externí API host, nastav NEXT_PUBLIC_API_URL.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    let msg = text || r.statusText;
    try { const j = JSON.parse(text); msg = j.error ?? msg; } catch {}
    throw new Error(`API ${r.status}: ${msg}`);
  }
  return r.json() as Promise<T>;
}

// ---------- GSS scan ----------
export interface ScanResponse {
  piece: {
    id: string; dm_code: string; status: string;
    current_location: { code: string; name?: string } | null;
    lifecycle: Record<string, unknown>;
  };
  product: {
    gpc_product_id: string | null; gid: string; type: string;
    name: string; manufacturer: string | null;
    params: Record<string, unknown> | null;
    external_refs: Record<string, unknown> | null;
  } | null;
  next_action: {
    code: string; title: string;
    severity: "info" | "warning" | "critical";
    target_location?: { code: string; name?: string };
    instructions: string[];
  };
  allowed_transitions: Array<{ action: string; to_location_code: string | null }>;
}

export function scan(input: {
  tenant_prefix: string;
  dm_code: string;
  event?: "RETURN_FROM_MACHINE" | "ISSUE_TO_MACHINE" | "RETURN_FROM_SERVICE" | "INSPECT";
}) {
  return call<ScanResponse>("/api/gss/scan", { method: "POST", body: JSON.stringify(input) });
}

// ---------- GSS univerzální hledání ----------
export interface GssSearchResponse {
  items: Array<{ item_id: string; gid: string; name: string; manufacturer: string | null; type: string; is_local: boolean; via_params?: boolean }>;
  catalog: Array<{ product_id: string; gid: string; name: string; manufacturer: string | null; type: string; via_params?: boolean }>;
  pieces: Array<{ dm_code: string; qid: string | null; status: string; item_id: string; name: string }>;
  external: Array<{ system: string; value: string; item_id: string; name: string }>;
}

export function searchGss(q: string) {
  return call<GssSearchResponse>(`/api/gss/search?q=${encodeURIComponent(q)}`);
}

// ---------- GSS move ----------
export function move(input: {
  tenant_prefix: string;
  piece_dm_code: string;
  movement: "receive" | "issue" | "transfer" | "service_out" | "service_in" | "scrap" | "adjust";
  from_location_code?: string;
  to_location_code?: string;
  payload?: Record<string, unknown>;
  created_by?: string;
}) {
  return call<{
    movement_id: string; piece_id: string;
    new_status: string;
    new_location: { code: string } | null;
    occurred_at: string;
  }>("/api/gss/move", { method: "POST", body: JSON.stringify(input) });
}
