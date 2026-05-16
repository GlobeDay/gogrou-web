"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [err, setErr]     = useState<string | null>(null);
  const [done, setDone]   = useState(false);
  const [pending, start]  = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const sb = getBrowserSupabase();
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/callback?type=recovery&next=/update-password`,
      });
      if (error) { setErr(error.message); return; }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto h-10 w-10 text-emerald-500" />
        <p className="text-sm">
          Pokud účet <span className="font-mono">{email}</span> existuje, poslali jsme ti reset email.
        </p>
        <Link href="/login" className="text-sm hover:underline">← Zpět na přihlášení</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoFocus required className="mt-1"
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Poslat reset email
      </Button>
      <div className="text-center text-sm pt-2">
        <Link href="/login" className="text-muted-foreground hover:text-foreground hover:underline">
          ← Zpět na přihlášení
        </Link>
      </div>
    </form>
  );
}
