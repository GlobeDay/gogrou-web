import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase, TOOL_TYPE_LABELS, type ToolType } from "@/lib/supabase";
import { fmtValue, fmtDate } from "@/lib/format";
import { can } from "@/lib/tenant";
import { StatusBadge } from "@/components/status-badge";

type Params = Promise<{ id: string }>;

interface SchemaParam {
  param_code: string;
  param_label_en: string | null;
  param_label_cs: string | null;
  data_type: string | null;
  unit: string | null;
  section: string | null;
  required: boolean;
  display_order: number;
}

async function getProduct(id: string) {
  const { data, error } = await supabase
    .from("gpc_products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

async function getSchema(type: string): Promise<SchemaParam[]> {
  const { data } = await supabase
    .from("gpc_class_schema")
    .select("param_code, param_label_en, param_label_cs, data_type, unit, section, required, display_order")
    .eq("class_code", type)
    .order("display_order");
  return (data ?? []) as SchemaParam[];
}

export default async function GpcDetail({ params }: { params: Params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const [schema, canEdit] = await Promise.all([getSchema(product.type), can("gpc.edit")]);
  const params_ = (product.params ?? {}) as Record<string, unknown>;

  // Group params by section
  const bySection: Record<string, SchemaParam[]> = {};
  for (const p of schema) {
    const sec = p.section ?? "Other";
    (bySection[sec] ??= []).push(p);
  }
  // Params, které jsou v produktu ale ne ve schématu (custom, _prefix...)
  const schemaCodes = new Set(schema.map((s) => s.param_code));
  const extraCodes  = Object.keys(params_).filter((k) => !schemaCodes.has(k));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      <Link href="/gpc" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Zpět na search
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <div className="text-sm text-muted-foreground mt-1">
            <span className="font-mono">{product.gid}</span> · {product.manufacturer ?? "—"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          <Badge variant="outline" className="font-mono">{product.type}</Badge>
          <span className="text-muted-foreground">{TOOL_TYPE_LABELS[product.type as ToolType]?.cs}</span>
          <StatusBadge status={product.status} />
          {canEdit && (
            <Link href={`/gpc/${product.id}/edit`} className="mt-2">
              <Button size="sm" variant="outline" className="h-7"><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
            </Link>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(bySection).map(([section, paramList]) => (
          <Card key={section}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{section}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {paramList.map((p) => {
                const v = params_[p.param_code];
                const label = p.param_label_cs ?? p.param_label_en ?? p.param_code;
                return (
                  <div key={p.param_code} className="flex justify-between items-baseline text-sm border-b last:border-0 py-1.5">
                    <span className="text-muted-foreground">
                      {label}
                      {p.required && <span className="text-destructive ml-1">*</span>}
                      <span className="font-mono text-xs ml-1 opacity-60">({p.param_code})</span>
                    </span>
                    <span className="font-medium text-right">{fmtValue(v, p.unit ?? undefined)}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {extraCodes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ostatní (mimo template)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {extraCodes.map((code) => (
                <div key={code} className="flex justify-between items-baseline text-sm border-b last:border-0 py-1.5">
                  <span className="text-muted-foreground font-mono text-xs">{code}</span>
                  <span className="font-medium text-right text-xs">{fmtValue(params_[code])}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {product.external_refs && Object.keys(product.external_refs as object).length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">External refs</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(product.external_refs, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground">
        Created: {fmtDate(product.created_at)} · Updated: {fmtDate(product.updated_at)}
      </div>
    </div>
  );
}
