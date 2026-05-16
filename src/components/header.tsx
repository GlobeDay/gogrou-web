import Link from "next/link";
import { ScanLine, Warehouse, Package, History, Upload, Brain, Boxes } from "lucide-react";
import { TenantSwitcher } from "./tenant-switcher";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";
import { BrandLockup } from "./brand-mark";
import { getUserTenants, getActiveTenant } from "@/lib/tenant";

const NAV = [
  { href: "/gpc",           label: "Catalog", icon: Boxes,     match: "/gpc" },
  { href: "/gss/scan",      label: "Scan",    icon: ScanLine,  match: "/gss/scan" },
  { href: "/gss/items",     label: "Sklad",   icon: Package,   match: "/gss/item" },
  { href: "/gss/low-stock", label: "Reorder", icon: Warehouse, match: "/gss/low-stock" },
  { href: "/gss/audit",     label: "Audit",   icon: History,   match: "/gss/audit" },
  { href: "/gss/import",    label: "Import",  icon: Upload,    match: "/gss/import" },
  { href: "/gina",          label: "GINA",    icon: Brain,     match: "/gina" },
];

export async function Header() {
  const [tenants, active] = await Promise.all([getUserTenants(), getActiveTenant()]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-4">
        <Link href="/" aria-label="Gogrou — domů" className="flex items-center mr-4 shrink-0">
          <BrandLockup markSize={22} />
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          {NAV.map(({ href, label, icon: Icon }, i) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground animate-in fade-in slide-in-from-top-1 duration-300"
              style={{ animationDelay: `${i * 35}ms`, animationFillMode: "backwards" }}
            >
              <Icon className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <TenantSwitcher tenants={tenants} active={active} />
          <span className="h-5 w-px bg-border" aria-hidden />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
