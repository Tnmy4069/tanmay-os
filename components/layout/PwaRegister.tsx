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
    <div className="fixed inset-x-3 z-[60] bottom-[calc(5.75rem+env(safe-area-inset-bottom))] lg:bottom-4 lg:right-4 lg:inset-x-auto lg:w-80 rounded-3xl border-2 border-border bg-card p-3 shadow-[var(--shadow-md)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-sm)]">
          <Download className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold">Install Tanmay OS</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">
            {showIos && !promptEvent
              ? "Share → Add to Home Screen for the app view."
              : "Add to home screen — feels like a native app + better reminders."}
          </p>
          {promptEvent && (
            <Button size="sm" className="mt-2 w-full" onClick={install}>
              Install
            </Button>
          )}
        </div>
        <button type="button" onClick={dismiss} className="rounded-full border-2 border-border p-1.5 hover:bg-secondary" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}