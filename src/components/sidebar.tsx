import Link from "next/link";
import { Boxes, ScanLine, Warehouse, Package, History, Upload, Brain, Settings2 } from "lucide-react";
import { TenantSwitcher } from "./tenant-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { BrandLockup } from "./brand-mark";
import { getUserTenants, getActiveTenant } from "@/lib/tenant";

const SECTIONS = [
  {
    label: "Catalog",
    items: [
      { href: "/gpc", label: "Produkty", icon: Boxes, match: "/gpc" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/gss/scan",      label: "DM Scan",        icon: ScanLine,  match: "/gss/scan" },
      { href: "/gss/items",     label: "Skladové karty", icon: Package,   match: "/gss/items" },
      { href: "/gss/import",    label: "Import DM",      icon: Upload,    match: "/gss/import" },
      { href: "/gss/low-stock", label: "Reorder",        icon: Warehouse, match: "/gss/low-stock" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/gina",      label: "GINA",     icon: Brain,   match: "/gina" },
      { href: "/gss/audit", label: "Audit",    icon: History, match: "/gss/audit" },
    ],
  },
];

export async function Sidebar({ currentPath }: { currentPath: string }) {
  const [tenants, active] = await Promise.all([getUserTenants(), getActiveTenant()]);

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border/60 bg-card/30 sticky top-0 h-screen">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2 px-4 h-14 border-b border-border/60 hover:bg-accent transition-colors"
        aria-label="Gogrou — domů"
      >
        <BrandLockup markSize={22} />
      </Link>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {SECTIONS.map((sec) => (
          <div key={sec.label} className="space-y-0.5">
            <div className="px-2 pb-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-semibold">
              {sec.label}
            </div>
            {sec.items.map((it) => {
              const active = currentPath === it.match || currentPath.startsWith(it.match + "/") ||
                             (it.match === "/gss/items" && currentPath.startsWith("/gss/item/"));
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors " +
                    (active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground")
                  }
                >
                  <it.icon className={`h-4 w-4 ${active ? "" : "opacity-70"}`} />
                  {it.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer: tenant + theme + user */}
      <div className="border-t border-border/60 p-3 space-y-2">
        <TenantSwitcher tenants={tenants} active={active} />
        <div className="flex items-center justify-between gap-1">
          <UserMenu />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

/** Mobile fallback — kompaktní top bar pro malé obrazovky (lg- breakpoint). */
export async function MobileBar() {
  return (
    <header className="lg:hidden sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-4">
        <Link href="/" aria-label="Gogrou — domů" className="flex items-center mr-auto">
          <BrandLockup markSize={20} />
        </Link>
        <ThemeToggle />
        <UserMenu />
      </div>
      <MobileNav />
    </header>
  );
}

import { MobileNav } from "./mobile-nav";
