"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Boxes, ScanLine, Warehouse, Package, History, Upload, Brain, Handshake, Menu, X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Pořadí kopíruje modulové členění: GPC · GSS · SmartSplit · GINA. */
const LINKS = [
  { href: "/gpc",           label: "GPC",            icon: Boxes },
  { href: "/gss/terminal",  label: "Terminál",       icon: Keyboard },
  { href: "/gss/scan",      label: "DM Scan",        icon: ScanLine },
  { href: "/gss/items",     label: "Skladové karty", icon: Package },
  { href: "/gss/import",    label: "Import DM",      icon: Upload },
  { href: "/gss/low-stock", label: "Reorder",        icon: Warehouse },
  { href: "/gss/audit",     label: "Audit",          icon: History },
  { href: "/ss",            label: "SmartSplit",     icon: Handshake },
  { href: "/gina",          label: "GINA",           icon: Brain },
];

export function MobileNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border/60 overflow-x-auto">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <Button size="sm" variant="ghost" className="h-7 px-2 lg:hidden" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <div className={`flex items-center gap-0.5 ${open ? "flex-wrap" : "flex-nowrap"} flex-1`}>
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs whitespace-nowrap transition-colors " +
                  (active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground")
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
