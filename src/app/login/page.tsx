import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { getServerUser } from "@/lib/supabase-server";
import { LoginForm } from "./login-form";

type SP = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await getServerUser();
  if (user) redirect(sp.next || "/");

  return (
    <AuthShell
      title="Přihlášení"
      description={
        <>
          Demo účty:{" "}
          <code className="text-foreground font-mono text-xs bg-muted px-1.5 py-0.5 rounded">admin@gogrou.test</code>
          {" / "}
          <code className="text-foreground font-mono text-xs bg-muted px-1.5 py-0.5 rounded">operator@gogrou.test</code>
        </>
      }
    >
      <LoginForm next={sp.next} error={sp.error} />
    </AuthShell>
  );
}
