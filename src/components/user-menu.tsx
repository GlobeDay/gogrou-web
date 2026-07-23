import Link from "next/link";
import { LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerUser } from "@/lib/supabase-server";
import { signOut } from "@/app/login/actions";

export async function UserMenu() {
  const user = await getServerUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <LogIn className="h-4 w-4" /> Přihlásit
      </Link>
    );
  }

  // Mono initials from email (e.g., "admin@gogrou.test" → "ad")
  const initials = (user.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <form action={signOut} className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-2xs font-semibold text-primary"
          title={user.email ?? undefined}
          aria-label={`Přihlášen jako ${user.email}`}
        >
          {initials}
        </span>
        <span className="text-xs text-muted-foreground max-w-[140px] truncate">{user.email}</span>
      </div>
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-xs"
        title="Odhlásit"
        aria-label="Odhlásit"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:ml-1">Odhlásit</span>
      </Button>
    </form>
  );
}
