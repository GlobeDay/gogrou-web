"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserSupabase() {
  if (!_client) _client = createBrowserClient<Database>(url, key);
  return _client;
}
