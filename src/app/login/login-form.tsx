"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export function LoginForm({ next, error: ssrError }: { next?: string; error?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(ssrError ?? null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const sb = getBrowserSupabase();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) { setErr(error.message); return; }
      router.push(next || "/");
      router.refresh();   // ať server components znovu načtou se session cookies
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoFocus required className="mt-1"
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="password">Heslo</Label>
        <Input id="password" type="password" required className="mt-1"
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Přihlásit
      </Button>
      <div className="flex justify-between text-xs pt-2">
        <a href="/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">
          Zapomenuté heslo?
        </a>
        <a href="/signup" className="text-muted-foreground hover:text-foreground hover:underline">
          Registrace →
        </a>
      </div>
    </form>
  );
}
