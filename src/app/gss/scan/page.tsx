import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase-server";
import { getActiveTenant, getActiveRole } from "@/lib/tenant";
import { ScanClient } from "./scan-client";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/gss/scan");

  const [tenant, role] = await Promise.all([getActiveTenant(), getActiveRole()]);
  return <ScanClient tenant={tenant ?? "DEV01"} role={role} />;
}
