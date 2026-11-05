import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerUser } from "@/lib/supabase-server";
import { listPieces, listWarehouseCards } from "../ops/actions";
import { ServiceForm } from "./service-form";
import { ServiceTerminal, type TerminalItem } from "./service-terminal";

export const dynamic = "force-dynamic";

export default async function ServicePage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/service");
  const [pieces, cards] = await Promise.all([listPieces(), listWarehouseCards()]);

  const items: TerminalItem[] = cards.map((c) => ({
    id: c.id,
    label: `${c.product.name} · ${c.product.gid}${c.tracking_mode === "quantity" ? " · bez DM" : ""}`,
    keywords: c.product.manufacturer ?? undefined,
    tracking_mode: c.tracking_mode,
    qty_on_hand: c.qty_on_hand ?? 0,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
      <Link href="/gss/terminal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Terminál
      </Link>
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Servisní terminál</h1>
        <Link href="/gss/shipments" className="text-sm underline">Servisní zásilky</Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Hromadné odeslání a příjem z broušení po položkách; množstevní servis pro položky bez DM.
      </p>
      <ServiceTerminal items={items} pieces={pieces} />

      <div className="space-y-2 pt-2">
        <h2 className="text-lg font-semibold tracking-tight">Parametry po broušení (per kus)</h2>
        <p className="text-sm text-muted-foreground">Zápis D/L1/L2 per cyklus, QID, štítek.</p>
        <ServiceForm pieces={pieces} />
      </div>
    </div>
  );
}
