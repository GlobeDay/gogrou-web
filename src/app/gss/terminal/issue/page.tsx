import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerUser } from "@/lib/supabase-server";
import { listPieces, listWarehouseCards } from "../../ops/actions";
import { IssueForm } from "./issue-form";

export const dynamic = "force-dynamic";

export default async function IssuePage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/terminal/issue");
  const [items, pieces] = await Promise.all([
    listWarehouseCards(),
    listPieces({ statuses: ["in_stock"] }),
  ]);
  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-4">
      <Link href="/gss/terminal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Terminál
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Výdej do výroby</h1>
      <IssueForm items={items} pieces={pieces} />
    </div>
  );
}
