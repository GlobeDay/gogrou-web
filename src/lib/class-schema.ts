/**
 * Helper pro načítání `gpc_class_schema` view — definice parametrů per třída.
 * Slouží jako zdroj pro dynamicky vyrobené filtry, formuláře a sekce v detailu.
 */
import { supabase } from "./supabase";

export interface ParamDef {
  param_code:      string;
  label_cs:        string | null;
  label_en:        string | null;
  data_type:       string | null;   // text | enum | float | int | date | bool
  unit:            string | null;
  section:         string | null;
  enum_values:     string[] | null;
  required:        boolean;
  display_order:   number;
}

/** Sekce, které mají smysl jako quick filtry (nepouštět Identity / Logistics / Manufacturer). */
const FILTERABLE_SECTIONS = new Set([
  "Geometry", "Threading", "Material", "Application", "Cutting",
  "Cooling", "Shank", "Mounting", "Standards", "Classification",
]);

const SECTION_PRIORITY: Record<string, number> = {
  Geometry: 1, Threading: 2, Material: 3, Application: 4, Cutting: 5,
  Cooling: 6, Shank: 7, Standards: 8, Mounting: 9, Classification: 10,
};

/** Načti všechny param defs pro třídu, seřazené pro UI. */
export async function getClassSchema(classCode: string): Promise<ParamDef[]> {
  const { data, error } = await supabase
    .from("gpc_class_schema")
    .select("*")
    .eq("class_code", classCode)
    .order("display_order");
  if (error || !data) return [];

  return data
    .filter((r) => r.param_code !== null)
    .map((r) => ({
      param_code:    r.param_code as string,
      label_cs:      r.param_label_cs,
      label_en:      r.param_label_en,
      data_type:     r.data_type,
      unit:          r.unit,
      section:       r.section,
      enum_values:   r.enum_values,
      required:      r.required ?? false,
      display_order: r.display_order ?? 0,
    }));
}

/**
 * Vyfiltruj jen ty params, které dávají smysl jako quick filtry.
 * Priorita: required > section priority > display_order.
 * Limit `max` — default 8 (víc by zaplnilo UI).
 */
export function selectQuickFilters(all: ParamDef[], max = 8): ParamDef[] {
  return [...all]
    .filter((p) => p.section && FILTERABLE_SECTIONS.has(p.section))
    .filter((p) => p.data_type !== "date") // date filters jsou edge case
    .sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1;
      const sa = SECTION_PRIORITY[a.section ?? ""] ?? 99;
      const sb = SECTION_PRIORITY[b.section ?? ""] ?? 99;
      if (sa !== sb) return sa - sb;
      return a.display_order - b.display_order;
    })
    .slice(0, max);
}
