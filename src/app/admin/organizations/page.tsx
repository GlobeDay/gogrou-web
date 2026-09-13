import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase-server";
import { getUserTenants, isGlobalAdmin } from "@/lib/tenant";
import { OrgRequestList } from "./org-request-list";

export const dynamic = "force-dynamic";

export default async function AdminOrgsPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/admin/organizations");
  const [tenants, admin] = await Promise.all([getUserTenants(), isGlobalAdmin()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Organizace</h1>
      <p className="text-sm text-muted-foreground">
        Živé tenanty z Supabase. LocalStorage žádosti z /register. Zápis nového tenanta je RLS-blokovaný bez SQL.
      </p>
      <div className="flex gap-3 text-sm">
        <Link href="/register" className="underline">+ Nová firma</Link>
        <Link href="/gss/terminal" className="underline">Otevřít GSS</Link>
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-medium">Supabase tenants</h2>
        <ul className="text-sm space-y-1">
          {tenants.map((t) => (
            <li key={t.tenant_id} className="flex justify-between gap-3 border-b border-border/60 py-2">
              <span><span className="font-mono">{t.prefix}</span> · {t.name}</span>
              <span className="text-muted-foreground">{t.role}</span>
            </li>
          ))}
        </ul>
      </div>
      {admin && <p className="text-xs text-muted-foreground">Jsi global admin — můžeš zkusit insert tenanta z /register.</p>}
      <OrgRequestList />
    </div>
  );
}
