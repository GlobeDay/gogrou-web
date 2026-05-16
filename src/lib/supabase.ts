import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

/** Browser/server share — RLS off, klíč veřejně dostupný. */
export const supabase = createClient<Database>(url, key, {
  auth: { persistSession: false },
});

export type ToolType =
  | "tool.drill" | "tool.endmill" | "tool.insert" | "tool.holder"
  | "tool.tap"   | "tool.reamer"  | "tool.thread_mill" | "tool.thread_die"
  | "tool.drill_insert" | "tool.grooving_insert" | "tool.threading_insert"
  | "coating";

export const TOOL_TYPE_LABELS: Record<ToolType, { en: string; cs: string }> = {
  "tool.drill":            { en: "Drill",            cs: "Vrták" },
  "tool.endmill":          { en: "End mill",         cs: "Fréza" },
  "tool.insert":           { en: "Turning insert",   cs: "Soustružnická destička" },
  "tool.drill_insert":     { en: "Drilling insert",  cs: "Vrtací destička" },
  "tool.grooving_insert":  { en: "Grooving insert",  cs: "Zápichová destička" },
  "tool.threading_insert": { en: "Threading insert", cs: "Závitová destička" },
  "tool.holder":           { en: "Tool holder",      cs: "Upínač / držák" },
  "tool.tap":              { en: "Tap",              cs: "Závitník" },
  "tool.reamer":           { en: "Reamer",           cs: "Výstružník" },
  "tool.thread_mill":      { en: "Thread mill",      cs: "Závitová fréza" },
  "tool.thread_die":       { en: "Thread die",       cs: "Závitová matrice" },
  "coating":               { en: "Coating",          cs: "Povlak" },
};

export const ALL_TOOL_TYPES = Object.keys(TOOL_TYPE_LABELS) as ToolType[];
