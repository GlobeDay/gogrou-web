"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_TOOL_TYPES, TOOL_TYPE_LABELS, type ToolType } from "@/lib/supabase";
import type { ParamDef } from "@/lib/class-schema";
import { Search, FilterX } from "lucide-react";

const RANGE_TYPES = new Set(["float", "int"]);
const SECTION_LABELS_CS: Record<string, string> = {
  Geometry: "Geometrie", Threading: "Závit", Material: "Materiál",
  Application: "Aplikace", Cutting: "Řezání", Cooling: "Chlazení",
  Shank: "Stopka", Standards: "Normy", Mounting: "Upnutí",
  Classification: "Třídění", Other: "Ostatní",
};

export function SearchForm({
  initialType,
  initialText,
  initialFilters,
  quickFilters,
}: {
  initialType: ToolType;
  initialText: string;
  initialFilters: Record<string, string>;
  quickFilters: ParamDef[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [type, setType] = useState<ToolType>(initialType);
  const [text, setText] = useState(initialText);
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);

  // Reset filtrů, když user změní type (server pošle nové schema)
  useEffect(() => { if (type !== initialType) setFilters({}); }, [type, initialType]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    params.set("type", type);
    if (text)  params.set("q", text);
    // preserve sort/dir
    const sortField = sp.get("sort"); const sortDir = sp.get("dir");
    if (sortField) { params.set("sort", sortField); if (sortDir) params.set("dir", sortDir); }
    for (const [k, v] of Object.entries(filters)) {
      if (v && v.trim()) params.set(`f.${k}`, v.trim());
    }
    router.push(`/gpc?${params.toString()}`);
  }

  function clearAll() {
    setText(""); setFilters({});
    router.push(`/gpc?type=${type}`);
  }

  // Skupiny podle section pro UI
  const grouped: Record<string, ParamDef[]> = {};
  for (const p of quickFilters) (grouped[p.section ?? "Other"] ??= []).push(p);

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border p-4 bg-card">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Typ produktu</Label>
          <Select value={type} onValueChange={(v) => v && setType(v as ToolType)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_TOOL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  <span className="font-mono text-xs mr-2">{t}</span>
                  {TOOL_TYPE_LABELS[t].cs}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Text v name / gid</Label>
          <Input className="mt-1" placeholder="Hledat..." value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      </div>

      {Object.entries(grouped).map(([section, params]) => (
        <div key={section}>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            {SECTION_LABELS_CS[section] ?? section}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {params.map((p) => <FilterField key={p.param_code} def={p} filters={filters} setFilters={setFilters} />)}
          </div>
        </div>
      ))}

      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clearAll}>
          <FilterX className="h-4 w-4 mr-1" /> Vyčistit
        </Button>
        <Button type="submit">
          <Search className="h-4 w-4 mr-1" /> Hledat
        </Button>
      </div>
    </form>
  );
}

function FilterField({ def, filters, setFilters }: {
  def: ParamDef;
  filters: Record<string, string>;
  setFilters: (f: Record<string, string>) => void;
}) {
  const label = def.label_cs ?? def.label_en ?? def.param_code;
  const unit  = def.unit ? ` [${def.unit}]` : "";
  const req   = def.required ? " *" : "";

  // ENUM → Select
  if (def.data_type === "enum" && def.enum_values && def.enum_values.length > 0 && def.enum_values.length <= 20) {
    return (
      <div>
        <Label className="text-xs" title={def.param_code}>{label}{unit}{req}</Label>
        <Select
          value={filters[def.param_code] ?? "__any__"}
          onValueChange={(v) => setFilters({ ...filters, [def.param_code]: v === "__any__" ? "" : (v ?? "") })}
        >
          <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__any__">Kterákoli</SelectItem>
            {def.enum_values.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // NUMERIC → range (min/max)
  if (def.data_type && RANGE_TYPES.has(def.data_type)) {
    return (
      <div className="grid grid-cols-2 gap-1">
        <div>
          <Label className="text-xs truncate" title={def.param_code}>{label}{unit}{req} min</Label>
          <Input className="mt-1" type="number" step="any"
            value={filters[`${def.param_code}.gte`] ?? ""}
            onChange={(e) => setFilters({ ...filters, [`${def.param_code}.gte`]: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs truncate">max</Label>
          <Input className="mt-1" type="number" step="any"
            value={filters[`${def.param_code}.lte`] ?? ""}
            onChange={(e) => setFilters({ ...filters, [`${def.param_code}.lte`]: e.target.value })} />
        </div>
      </div>
    );
  }

  // TEXT (eq match — pro přesnost; pro substring user může používat name/gid search)
  return (
    <div>
      <Label className="text-xs" title={def.param_code}>{label}{unit}{req}</Label>
      <Input className="mt-1" type="text"
        value={filters[def.param_code] ?? ""}
        onChange={(e) => setFilters({ ...filters, [def.param_code]: e.target.value })} />
    </div>
  );
}
