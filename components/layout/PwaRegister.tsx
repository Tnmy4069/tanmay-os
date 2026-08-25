"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaRegister() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = isStandalone();
    const hide = localStorage.getItem("pwa-install-dismissed") === "1";
    if (ios && !standalone && !hide) setShowIos(true);
    if (hide) setDismissed(true);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem("pwa-install-dismissed", "1");
    setDismissed(true);
    setPromptEvent(null);
    setShowIos(false);
  }

  async function install() {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  if (dismissed || isStandalone()) return null;
  if (!promptEvent && !showIos) return null;

  return (
    <div className="fixed inset-x-3 z-[60] bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-4 lg:right-4 lg:inset-x-auto lg:w-80 rounded-2xl border border-white/10 bg-card/95 p-3 shadow-2xl backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Download className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install Tanmay OS</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {showIos && !promptEvent
              ? "Share → Add to Home Screen for the app view."
              : "Add it to your home screen. Works like a native app."}
          </p>
          {promptEvent && (
            <Button size="sm" className="mt-2 w-full" onClick={install}>
              Install
            </Button>
          )}
        </div>
        <button type="button" onClick={dismiss} className="rounded-lg p-1.5 hover:bg-white/5" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}