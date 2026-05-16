import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { getServerUser } from "@/lib/supabase-server";
import { UpdatePasswordForm } from "./update-form";

export default async function UpdatePasswordPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/update-password");

  return (
    <AuthShell
      title="Nové heslo"
      description={
        <>Pro účet <code className="text-foreground font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{user.email}</code></>
      }
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
