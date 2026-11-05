import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownToLine, ArrowUpFromLine, Bookmark, Gavel, PackagePlus, RotateCcw, ScanLine,
  Search, Send, ShoppingCart, Stamp, Tags, Truck, Warehouse, Wrench,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSupabase, getServerUser } from "@/lib/supabase-server";
import { getActiveTenant } from "@/lib/tenant";

const TILES = [
  { href: "/gss/terminal/receive", title: "Příjem", desc: "Naskladnit s dokladem", icon: ArrowDownToLine },
  { href: "/gss/terminal/issue", title: "Výdej", desc: "Výdej do výroby", icon: ArrowUpFromLine },
  { href: "/gss/terminal/return", title: "Návrat z výroby", desc: "Do fronty, nebo rozhodnout hned", icon: RotateCcw },
  { href: "/gss/decisions", title: "Čeká na rozhodnutí", desc: "Rozhodovací fronta", icon: Gavel },
  { href: "/gss/terminal/reserve", title: "Rezervace", desc: "DM + release kód", icon: Bookmark },
  { href: "/gss/service", title: "Odeslat / příjem z broušení", desc: "Servisní terminál", icon: Wrench },
  { href: "/gss/scan", title: "Načíst DM/QID", desc: "Scan terminál", icon: ScanLine },
  { href: "/gss/search", title: "Hledat", desc: "Univerzální hledání", icon: Search },
  { href: "/gss/orders", title: "Objednávky", desc: "Návrhy a příjem na objednávku", icon: ShoppingCart },
  { href: "/gss/adopt", title: "Vyhledat v GPC", desc: "Převzít do skladu", icon: PackagePlus },
  { href: "/gss/local-item", title: "Lokální položka", desc: "Nevalidovaná SKU", icon: Stamp },
  { href: "/gss/overstock", title: "Nadnormativní zásoby", desc: "Nabídka přebytku", icon: Tags },
  { href: "/gss/shipments", title: "Servisní zásilky", desc: "Třífázové workflow s brusírnou", icon: Truck },
  { href: "/gss/low-stock", title: "Objednávkový návrh", desc: "Reorder export", icon: Warehouse },
  { href: "/gss/items", title: "Skladové položky", desc: "Karty a kusy", icon: Send },
];

export const dynamic = "force-dynamic";

export default async function TerminalPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/terminal");
  const tenant = await getActiveTenant();

  // Počet kusů v rozhodovací frontě pro badge na dlaždici (P4)
  let awaiting = 0;
  if (tenant) {
    const sb = await getServerSupabase();
    const { data: tenantRow } = await sb.from("gss_tenants").select("id").eq("prefix", tenant).maybeSingle();
    if (tenantRow) {
      const { count } = await sb
        .from("gss_pieces")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantRow.id)
        .eq("status", "awaiting_decision");
      awaiting = count ?? 0;
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      <div>
        <p className="text-2xs uppercase tracking-label text-muted-foreground">Terminál</p>
        <h1 className="text-2xl font-bold tracking-tight">GSS provoz</h1>
        <p className="text-sm text-muted-foreground mt-1">
          tenant <span className="font-mono">{tenant ?? "—"}</span> · lock-parity toky nad živými kusy
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TILES.map((tile) => (
          <Link key={tile.href} href={tile.href}>
            <Card className="h-full hover:bg-accent/40 transition-colors">
              <CardHeader className="pb-1">
                <CardDescription className="flex items-center gap-2">
                  <tile.icon className="h-4 w-4" />
                  {tile.title}
                </CardDescription>
                <CardTitle className="text-base">
                  {tile.href === "/gss/decisions" && awaiting > 0 ? `${awaiting} ks ve frontě` : tile.desc}
                </CardTitle>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
