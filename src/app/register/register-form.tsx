"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { tryCreateTenant } from "../gss/ops/actions";
import { Field, OpsSubmit } from "../gss/ops/ops-form";

const STORAGE_KEY = "gogrou_organizations";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [ico, setIco] = useState("");
  const [email, setEmail] = useState("");
  const [modules, setModules] = useState<string[]>(["GSS"]);

  function toggle(mod: string) {
    setModules((cur) => (cur.includes(mod) ? cur.filter((m) => m !== mod) : [...cur, mod]));
  }

  function saveLocal() {
    const org = {
      id: crypto.randomUUID(),
      name,
      prefix: prefix.toUpperCase(),
      ico,
      email,
      selectedModules: modules,
      status: "trial",
      createdAt: new Date().toISOString(),
    };
    const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    localStorage.setItem(STORAGE_KEY, JSON.stringify([org, ...(Array.isArray(prev) ? prev : [])]));
    toast.success("Organizace uložena lokálně.");
    router.push("/admin/organizations");
  }

  return (
    <div className="grid gap-3">
      <Field label="Název firmy"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Interní prefix"><Input value={prefix} onChange={(e) => setPrefix(e.target.value)} /></Field>
      <Field label="IČO"><Input value={ico} onChange={(e) => setIco(e.target.value)} /></Field>
      <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <div className="flex flex-wrap gap-3 text-sm">
        {["GSS", "Toolshop", "Services", "GPC supplier data channel", "Promitea/RFQ"].map((mod) => (
          <label key={mod} className="flex items-center gap-1">
            <input type="checkbox" checked={modules.includes(mod)} onChange={() => toggle(mod)} />
            {mod}
          </label>
        ))}
      </div>
      <OpsSubmit
        label="Vytvořit organizaci (Supabase)"
        disabled={!name || !prefix}
        run={() => tryCreateTenant({ name, prefix })}
      />
      <button type="button" className="text-sm underline text-left" onClick={saveLocal}>
        Uložit jako localStorage žádost
      </button>
    </div>
  );
}
