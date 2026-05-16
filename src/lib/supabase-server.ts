/**
 * Server-side Supabase client (cookies based).
 * Použij v Server Components a Route Handlers.
 *
 * Pro Server Component, kde se session refresh nehodí (read-only stránka),
 * volej s `read_only: true` — vrátí klienta s no-op cookies sink.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as CookieOptions));
        } catch {
          // Server Components nemůžou nastavovat cookies — middleware to udělá.
        }
      },
    },
  });
}

/** Vrátí aktuálního usera nebo null. */
export async function getServerUser() {
  const sb = await getServerSupabase();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/** Vrátí access_token aktuální session pro forwarding do gogrou-api. */
export async function getServerSessionToken(): Promise<string | null> {
  const sb = await getServerSupabase();
  const { data: { session } } = await sb.auth.getSession();
  return session?.access_token ?? null;
}
