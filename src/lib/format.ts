/** Format hodnoty s jednotkou pro display. */
export function fmtValue(value: unknown, unit?: string | null): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "number") {
    const s = Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, "");
    return unit ? `${s} ${unit}` : s;
  }
  return String(value);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("cs-CZ", { dateStyle: "short", timeStyle: "short" }); }
  catch { return iso; }
}
