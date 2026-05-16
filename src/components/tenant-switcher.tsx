"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setActiveTenantAction, type UserTenant } from "@/lib/tenant";

export function TenantSwitcher({ tenants, active }: { tenants: UserTenant[]; active: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (tenants.length === 0) return null;

  function onChange(prefix: string | null) {
    if (!prefix) return;
    start(async () => {
      const fd = new FormData();
      fd.append("prefix", prefix);
      await setActiveTenantAction(fd);
      router.refresh();
    });
  }

  if (tenants.length === 1) {
    const t = tenants[0];
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
        <span className="font-mono">{t.prefix}</span>
        <span className="opacity-60">· {t.role}</span>
      </div>
    );
  }

  return (
    <Select value={active ?? tenants[0].prefix} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="h-8 text-xs gap-1 w-auto">
        <Building2 className="h-3.5 w-3.5" />
        <SelectValue />
        <ChevronDown className="h-3 w-3 opacity-50" />
      </SelectTrigger>
      <SelectContent>
        {tenants.map((t) => (
          <SelectItem key={t.tenant_id} value={t.prefix}>
            <div className="flex flex-col">
              <span className="font-mono text-xs">{t.prefix}</span>
              <span className="text-[10px] opacity-60">{t.name} · {t.role}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
