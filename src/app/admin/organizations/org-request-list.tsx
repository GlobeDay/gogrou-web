"use client";

import { useEffect, useState } from "react";

type Org = {
  id: string;
  name: string;
  prefix: string;
  status?: string;
  selectedModules?: string[];
};

export function OrgRequestList() {
  const [rows, setRows] = useState<Org[]>([]);
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("gogrou_organizations") ?? "[]");
      setRows(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRows([]);
    }
  }, []);

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium">LocalStorage žádosti</h2>
      <ul className="text-sm space-y-1">
        {rows.map((o) => (
          <li key={o.id} className="flex justify-between gap-3 border-b border-border/60 py-2">
            <span><span className="font-mono">{o.prefix}</span> · {o.name}</span>
            <span className="text-muted-foreground">{o.status} · {(o.selectedModules ?? []).join(", ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
