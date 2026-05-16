"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export function SignupForm() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]           = useState<string | null>(null);
  const [done, setDone]         = useState(false);
  const [pending, start]        = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const sb = getBrowserSupabase();
      const { error } = await sb.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback?next=/`,
        },
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
          Odeslali jsme ti potvrzovací email na <span className="font-mono">{email}</span>.
          Klikni na link v emailu, ať aktivuješ účet.
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
      <div>
        <Label htmlFor="password">Heslo (min. 8 znaků)</Label>
        <Input id="password" type="password" required minLength={8} className="mt-1"
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Registrovat
      </Button>
      <div className="text-center text-sm pt-2">
        <Link href="/login" className="text-muted-foreground hover:text-foreground hover:underline">
          Už máš účet? Přihlásit se
        </Link>
      </div>
    </form>
  );
}
