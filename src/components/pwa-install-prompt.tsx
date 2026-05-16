"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * PWA Install Prompt:
 *  - Poslouchá `beforeinstallprompt` event (Chromium browsers)
 *  - Po 5 s zobrazí toast-style banner v rohu
 *  - User Install → `prompt()` API zobrazí native install dialog
 *  - User Dismiss → localStorage flag, neukazovat 30 dní
 *
 * Safari (iOS) `beforeinstallprompt` neposílá → tam je třeba ručně "Přidat na plochu".
 */

const DISMISS_KEY = "gogrou:pwa-install-dismissed";
const DISMISS_DAYS = 30;

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible]   = useState(false);

  useEffect(() => {
    // Skip pokud user nedávno dismissoval
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 3600 * 1000) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      // Trochu počkat — ať se to neukáže okamžitě
      setTimeout(() => setVisible(true), 5_000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function install() {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.then(({ outcome }) => {
      if (outcome === "dismissed") {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      }
      setVisible(false);
      setDeferred(null);
    });
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible || !deferred) return null;

  return (
    <div
      role="dialog"
      aria-label="Nainstalovat Gogrou jako aplikaci"
      className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-2 fade-in duration-300"
    >
      <Card className="border-primary/30 shadow-lg">
        <div className="p-3 flex items-start gap-3">
          <div className="rounded-md bg-primary/15 p-2 shrink-0">
            <Download className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Nainstalovat Gogrou</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Spustí se jako samostatná app (užitečné na shop-floor tabletech).
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={install}>Instalovat</Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>Později</Button>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Zavřít"
            className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 p-1 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </Card>
    </div>
  );
}
