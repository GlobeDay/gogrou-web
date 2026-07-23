"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { ALL_TOOL_TYPES, TOOL_TYPE_LABELS, type ToolType } from "@/lib/supabase";
import type { ParamDef } from "@/lib/class-schema";
import { createProduct, updateProduct } from "@/app/gpc/actions";

type Mode = "create" | "edit";

export interface ProductFormInitial {
  id?: string;
  gid?: string;
  type: ToolType;
  name?: string;
  manufacturer?: string | null;
  status?: "active" | "phasing_out" | "discontinued";
  params?: Record<string, unknown>;
}

const SECTION_ORDER = [
  "Identity", "Manufacturer", "Classification", "Geometry", "Threading",
  "Material", "Application", "Cutting", "Cooling", "Shank",
  "Standards", "Mounting", "Physical", "Logistics", "Other",
];

const SECTION_LABELS_CS: Record<string, string> = {
  Identity: "Identifikace", Manufacturer: "Výrobce", Classification: "Třídění",
  Geometry: "Geometrie", Threading: "Závit", Material: "Materiál",
  Application: "Aplikace", Cutting: "Řezání", Cooling: "Chlazení",
  Shank: "Stopka", Standards: "Normy", Mounting: "Upnutí",
  Physical: "Fyzikální", Logistics: "Logistika", Other: "Ostatní",
};

export function ProductForm({ mode, initial, schema }: {
  mode: Mode;
  initial: ProductFormInitial;
  schema: ParamDef[];
}) {
  const router = useRouter();
  const [type, setType] = useState<ToolType>(initial.type);
  const [status, setStatus] = useState(initial.status ?? "active");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Schema je předané ze serveru pro `initial.type`. Když user mění type v create módu,
  // pošleme ho do URL a server re-fetch schema. Pro edit type fixed.
  function onTypeChange(t: string | null) {
    if (!t || mode === "edit") return;
    setType(t as ToolType);
    router.push(`/gpc/new?type=${t}`);
  }

  function onSubmit(formData: FormData) {
    setErr(null);
    formData.set("type", type);
    formData.set("status", status);
    start(async () => {
      try {
        const result = mode === "create"
          ? await createProduct(formData)
          : await updateProduct(initial.id!, formData);
        if (!result.ok) { setErr(result.error ?? "Chyba"); toast.error(result.error ?? "Chyba"); }
      } catch (e) {
        // redirect throws a special NEXT_REDIRECT — to je success path
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        setErr(e instanceof Error ? e.message : String(e));
      }
    });
  }

  const groups: Record<string, ParamDef[]> = {};
  for (const p of schema) (groups[p.section ?? "Other"] ??= []).push(p);
  const sortedSections = Object.keys(groups).sort(
    (a, b) => (SECTION_ORDER.indexOf(a) + 1 || 999) - (SECTION_ORDER.indexOf(b) + 1 || 999),
  );

  return (
    <form action={onSubmit} className="space-y-4">
      {/* Top-level identity */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Základní údaje</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={onTypeChange} disabled={mode === "edit"}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_TOOL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    <span className="font-mono text-xs mr-2">{t}</span>{TOOL_TYPE_LABELS[t].cs}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mode === "edit" && <p className="text-xs text-muted-foreground mt-1">Type po vytvoření nelze měnit.</p>}
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => v && setStatus(v as typeof status)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="phasing_out">phasing_out</SelectItem>
                <SelectItem value="discontinued">discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs" htmlFor="gid">GID *</Label>
            <Input id="gid" name="gid" required className="mt-1 font-mono"
              defaultValue={initial.gid ?? ""} disabled={mode === "edit"} />
            {mode === "edit" && <p className="text-xs text-muted-foreground mt-1">GID je immutable.</p>}
          </div>
          <div>
            <Label className="text-xs" htmlFor="name">Name *</Label>
            <Input id="name" name="name" required className="mt-1" defaultValue={initial.name ?? ""} />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs" htmlFor="manufacturer">Manufacturer</Label>
            <Input id="manufacturer" name="manufacturer" className="mt-1" defaultValue={initial.manufacturer ?? ""} />
          </div>
        </CardContent>
      </Card>

      {/* Sections from template */}
      {sortedSections.map((section) => (
        <Card key={section}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{SECTION_LABELS_CS[section] ?? section}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groups[section].map((p) => (
              <ParamField key={p.param_code} def={p} value={initial.params?.[p.param_code]} />
            ))}
          </CardContent>
        </Card>
      ))}

      {err && <Card><CardContent className="text-sm text-destructive py-3">{err}</CardContent></Card>}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <X className="h-4 w-4 mr-1" /> Zrušit
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          {mode === "create" ? "Vytvořit" : "Uložit"}
        </Button>
      </div>
    </form>
  );
}

function ParamField({ def, value }: { def: ParamDef; value: unknown }) {
  const name  = `params.${def.param_code}`;
  const label = def.label_cs ?? def.label_en ?? def.param_code;
  const unit  = def.unit ? ` [${def.unit}]` : "";
  const req   = def.required ? " *" : "";
  const placeholder = `${def.data_type ?? "text"}${unit}`;
  const strVal = value == null ? "" : Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value);

  if (def.data_type === "enum" && def.enum_values && def.enum_values.length > 0 && def.enum_values.length <= 30) {
    return (
      <EnumField name={name} label={label + unit + req} options={def.enum_values} defaultValue={strVal} required={def.required} />
    );
  }
  if (def.data_type === "bool") {
    return (
      <div className="flex items-end gap-2">
        <input type="checkbox" name={name} value="true" defaultChecked={value === true || value === "true"} className="h-4 w-4" />
        <Label className="text-xs">{label}{req}</Label>
      </div>
    );
  }
  const inputType = def.data_type === "int" || def.data_type === "float" ? "number" : "text";
  return (
    <div>
      <Label className="text-xs" htmlFor={name} title={`${def.param_code} · ${def.data_type ?? "text"}`}>
        {label}{unit}{req}
      </Label>
      <Input id={name} name={name} type={inputType} step={inputType === "number" ? "any" : undefined}
        className="mt-1" placeholder={placeholder} defaultValue={strVal} required={def.required} />
      <p className="text-2xs text-muted-foreground font-mono mt-0.5">{def.param_code}</p>
    </div>
  );
}

function EnumField({ name, label, options, defaultValue, required }: {
  name: string; label: string; options: string[]; defaultValue: string; required: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <input type="hidden" name={name} value={value} />
      <Select value={value || "__none__"} onValueChange={(v) => v && setValue(v === "__none__" ? "" : v)}>
        <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
        <SelectContent>
          {!required && <SelectItem value="__none__">(nevyplněno)</SelectItem>}
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
