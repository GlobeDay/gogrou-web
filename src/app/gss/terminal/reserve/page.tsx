import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerUser } from "@/lib/supabase-server";
import { listPieces } from "../../ops/actions";
import { ReserveForm } from "./reserve-form";

export const dynamic = "force-dynamic";

export default async function ReservePage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/terminal/reserve");
  const pieces = await listPieces({ statuses: ["in_stock"] });
  const free = pieces.filter((p) => !p.lifecycle.reservation?.active && !p.lifecycle.blocked);
  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-4">
      <Link href="/gss/terminal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Terminál
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Rezervace</h1>
      <p className="text-sm text-muted-foreground">DM rezervace = 1 konkrétní kus. Vygeneruje release kód.</p>
      <ReserveForm pieces={free} />
    </div>
  );
}
