import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/gpc/product-form";
import { getClassSchema } from "@/lib/class-schema";
import { can } from "@/lib/tenant";
import { supabase, type ToolType } from "@/lib/supabase";

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  if (!(await can("gpc.edit"))) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Nemáš oprávnění</h1>
        <p className="text-sm text-muted-foreground mt-2">Pro editaci GPC katalogu potřebuješ roli <span className="font-mono">admin</span>.</p>
        <Link href="/gpc" className="text-sm hover:underline mt-3 inline-block">← Zpět</Link>
      </div>
    );
  }

  const { id } = await params;
  const { data, error } = await supabase
    .from("gpc_products").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();

  const schema = await getClassSchema(data.type);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <Link href={`/gpc/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Zpět na detail
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upravit: {data.name}</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">{data.gid}</p>
      </div>
      <ProductForm
        mode="edit"
        initial={{
          id: data.id, gid: data.gid, type: data.type as ToolType,
          name: data.name, manufacturer: data.manufacturer,
          status: data.status, params: (data.params ?? {}) as Record<string, unknown>,
        }}
        schema={schema}
      />
    </div>
  );
}
