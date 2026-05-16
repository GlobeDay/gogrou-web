"use server";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";

export async function signInWithPassword(formData: FormData) {
  const email    = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next     = String(formData.get("next") ?? "/");

  const sb = await getServerSupabase();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }
  redirect(next || "/");
}

export async function signOut() {
  const sb = await getServerSupabase();
  await sb.auth.signOut();
  redirect("/login");
}
