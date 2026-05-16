import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/gpc/product-form";
import { getClassSchema } from "@/lib/class-schema";
import { can } from "@/lib/tenant";
import type { ToolType } from "@/lib/supabase";

type SP = Promise<{ type?: string }>;

export default async function NewProductPage({ searchParams }: { searchParams: SP }) {
  // Admin gate
  if (!(await can("gpc.edit"))) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Nemáš oprávnění</h1>
        <p className="text-sm text-muted-foreground mt-2">Pro editaci GPC katalogu potřebuješ roli <span className="font-mono">admin</span>.</p>
        <Link href="/gpc" className="text-sm hover:underline mt-3 inline-block">← Zpět</Link>
      </div>
    );
  }

  const sp = await searchParams;
  const type = (sp.type ?? "tool.endmill") as ToolType;
  const schema = await getClassSchema(type);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <Link href="/gpc" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Zpět na search
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Nový produkt</h1>
      <ProductForm mode="create" initial={{ type, status: "active" }} schema={schema} />
    </div>
  );
}
