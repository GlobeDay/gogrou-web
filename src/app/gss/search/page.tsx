import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerUser } from "@/lib/supabase-server";
import { getActiveTenant } from "@/lib/tenant";
import { SearchClient } from "./search-client";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/search");
  const tenant = await getActiveTenant();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <Link href="/gss/terminal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Terminál
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hledat</h1>
        <p className="text-sm text-muted-foreground mt-1">
          tenant <span className="font-mono">{tenant ?? "—"}</span> · jedno pole přes položky, kusy, externí ID i katalog GPC
        </p>
      </div>
      <SearchClient initialQuery={q ?? ""} />
    </div>
  );
}
