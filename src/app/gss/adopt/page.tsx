import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getServerUser } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";
import { AdoptButton } from "./adopt-client";

export const dynamic = "force-dynamic";

type SP = Promise<{ q?: string }>;

export default async function AdoptPage({ searchParams }: { searchParams: SP }) {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/adopt");
  const { q = "" } = await searchParams;
  const query = q.trim().replace(/[%*,()]/g, "");

  let products: Array<{ id: string; gid: string; name: string; manufacturer: string | null; type: string }> = [];
  if (query.length >= 2) {
    const { data } = await supabase
      .from("gpc_products")
      .select("id, gid, name, manufacturer, type")
      .or(`name.ilike.%${query}%,gid.ilike.%${query}%,manufacturer.ilike.%${query}%`)
      .limit(40);
    products = data ?? [];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      <Link href="/gss/terminal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Terminál
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Převzít z GPC</h1>
        <p className="text-sm text-muted-foreground mt-1">Vyhledat v GPC a převzít do skladu aktivního tenanta.</p>
      </div>
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Hledat (nazev, vyrobce, GID)"
          className="h-8 max-w-md w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        />
        <button type="submit" className="text-sm underline">Hledat</button>
      </form>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produkt</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead className="w-[160px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/gpc/${p.id}`} className="hover:underline font-medium">{p.name}</Link>
                    <div className="font-mono text-xs text-muted-foreground">{p.gid} · {p.manufacturer ?? "—"}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.type}</TableCell>
                  <TableCell><AdoptButton productId={p.id} /></TableCell>
                </TableRow>
              ))}
              {query.length >= 2 && products.length === 0 && (
                <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Nic nenalezeno.</TableCell></TableRow>
              )}
              {query.length < 2 && (
                <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Zadej aspoň 2 znaky.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
