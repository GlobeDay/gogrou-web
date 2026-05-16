"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FilterX } from "lucide-react";

export function AuditFilters({
  initial,
  movementTypes,
}: {
  initial: { dm: string; mv: string; user: string; from: string; to: string };
  movementTypes: string[];
}) {
  const router = useRouter();
  const [s, setS] = useState(initial);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (s.dm)   params.set("dm",   s.dm);
    if (s.mv)   params.set("mv",   s.mv);
    if (s.user) params.set("user", s.user);
    if (s.from) params.set("from", s.from);
    if (s.to)   params.set("to",   s.to);
    router.push(`/gss/audit?${params.toString()}`);
  }

  function clear() {
    setS({ dm: "", mv: "", user: "", from: "", to: "" });
    router.push("/gss/audit");
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-2">
            <Label className="text-xs">DM kód</Label>
            <Input className="mt-1" placeholder="DM-..." value={s.dm} onChange={(e) => setS({ ...s, dm: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Movement</Label>
            <Select value={s.mv || "__any__"} onValueChange={(v) => setS({ ...s, mv: v === "__any__" ? "" : (v ?? "") })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__any__">Všechny</SelectItem>
                {movementTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Uživatel</Label>
            <Input className="mt-1" placeholder="op_12" value={s.user} onChange={(e) => setS({ ...s, user: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Od</Label>
            <Input className="mt-1" type="date" value={s.from} onChange={(e) => setS({ ...s, from: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Do</Label>
            <Input className="mt-1" type="date" value={s.to} onChange={(e) => setS({ ...s, to: e.target.value })} />
          </div>

          <div className="md:col-span-6 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clear}>
              <FilterX className="h-4 w-4 mr-1" /> Vyčistit
            </Button>
            <Button type="submit" size="sm">
              <Search className="h-4 w-4 mr-1" /> Filtrovat
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
