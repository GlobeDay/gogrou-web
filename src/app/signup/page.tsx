import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      title="Registrace"
      description="Po registraci ti přijde potvrzovací email. Tenant membership přidělí admin."
    >
      <SignupForm />
    </AuthShell>
  );
}
