"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [err, setErr]                   = useState<string | null>(null);
  const [done, setDone]                 = useState(false);
  const [pending, start]                = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8)      { setErr("Heslo musí mít aspoň 8 znaků."); return; }
    if (password !== confirm)     { setErr("Hesla se neshodují.");           return; }
    start(async () => {
      const sb = getBrowserSupabase();
      const { error } = await sb.auth.updateUser({ password });
      if (error) { setErr(error.message); return; }
      setDone(true);
      setTimeout(() => { router.push("/"); router.refresh(); }, 1500);
    });
  }

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <p className="text-sm">Heslo aktualizováno. Přesměrovávám…</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="password">Nové heslo</Label>
        <Input id="password" type="password" autoFocus required minLength={8} className="mt-1"
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="confirm">Potvrď heslo</Label>
        <Input id="confirm" type="password" required minLength={8} className="mt-1"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Uložit heslo
      </Button>
    </form>
  );
}
