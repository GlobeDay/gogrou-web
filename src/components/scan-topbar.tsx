/**
 * Kompaktní top bar pro shop-floor mode (/gss/scan).
 * Bez sidebar nav — operátor potřebuje minimum chrome.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "./brand-mark";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function ScanTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 max-w-5xl mx-auto">
        <Link href="/" aria-label="Zpět" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <BrandLockup markSize={20} />
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
