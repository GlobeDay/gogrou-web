"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 3-state toggle: light → dark → system. Avoid hydration mismatch:
 * pre-mount renderuje stable placeholder (žádná ikona) ať se SSR a CSR shodí.
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function cycle() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  const label = !mounted
    ? "Theme"
    : theme === "system"
      ? `Systém (${resolvedTheme})`
      : theme === "dark" ? "Tmavý" : "Světlý";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={cycle}
      aria-label={`Přepnout téma — aktuálně ${label}`}
      title={label}
      className="h-8 w-8 px-0"
    >
      {!mounted ? (
        <span className="block h-4 w-4" />
      ) : theme === "system" ? (
        <Monitor className="h-4 w-4" />
      ) : theme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}
