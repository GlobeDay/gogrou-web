import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

/**
 * Email confirmation / recovery callback.
 * Supabase pošle uživateli link:
 *   /auth/callback?code=...&next=/...&type=signup|recovery|email_change
 *
 * Tento route handler vymění `code` za session (uloží cookies) a přesměruje dál.
 */
export async function GET(req: NextRequest) {
  const url  = new URL(req.url);
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type");           // signup | recovery | email_change
  const next = url.searchParams.get("next") ?? defaultNextFor(type);

  if (code) {
    const sb = await getServerSupabase();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) {
      const dest = new URL("/login", url.origin);
      dest.searchParams.set("error", `Callback: ${error.message}`);
      return NextResponse.redirect(dest);
    }
  }
  return NextResponse.redirect(new URL(next, url.origin));
}

function defaultNextFor(type: string | null): string {
  if (type === "recovery") return "/update-password";
  return "/";
}
