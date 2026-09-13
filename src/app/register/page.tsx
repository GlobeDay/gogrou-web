import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Registrace organizace</h1>
      <p className="text-sm text-muted-foreground">
        Lock demo ukládalo firmy do localStorage. Tady se žádost uloží lokálně;
        vytvoření tenanta v Supabase umí jen global admin (RLS).
      </p>
      <RegisterForm />
    </div>
  );
}
