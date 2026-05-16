import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "./forgot-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset hesla"
      description="Pošleme ti email s linkem na nastavení nového hesla."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
