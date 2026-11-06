import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerUser } from "@/lib/supabase-server";
import { can } from "@/lib/tenant";
import { LocalItemForm } from "./local-item-form";

export const dynamic = "force-dynamic";

export default async function LocalItemPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/local-item");
  const canCreate = await can("gss.edit_lifecycle");

  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-4">
      <Link href="/gss/terminal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Terminál
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lokální položka (jen v GSS)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vytvoří skladovou kartu jen v GSS tenanta — do sdíleného katalogu GPC nic nezapisuje.
          O zařazení do GPC lze později požádat z karty položky.
        </p>
      </div>
      {canCreate ? (
        <LocalItemForm />
      ) : (
        <p className="text-sm text-muted-foreground">Tuto akci může provést supervisor a vyšší.</p>
      )}
    </div>
  );
}
