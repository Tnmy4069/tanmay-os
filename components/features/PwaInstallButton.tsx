"use client";

import { useEffect, useState, useTransition } from "react";
import { Download, RefreshCw, Smartphone, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [reinstalling, startReinstall] = useTransition();
  const [reinstallDone, setReinstallDone] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function handleInstall() {
    if (!promptEvent) return;
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setPromptEvent(null);
    }
  }

  async function handleReinstall() {
    startReinstall(async () => {
      try {
        // Unregister all service workers, clear caches, then re-register
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));

        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((n) => caches.delete(n)));

        // Re-register
        await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
        setReinstallDone(true);
        // Hard reload after short delay
        setTimeout(() => window.location.reload(), 800);
      } catch {
        // ignore
      }
    });
  }

  // Already installed — show reinstall option only
  if (installed || standalone) {
    return (
      <div className="rounded-3xl bg-secondary/80 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--success)]/20 text-[color:var(--success)]">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold">App Installed</p>
            <p className="text-xs font-semibold text-muted-foreground">
              Running as a PWA on your device
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReinstall}
          disabled={reinstalling || reinstallDone}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-extrabold transition-all active:scale-95",
            reinstallDone
              ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
              : "bg-card border-2 border-border hover:bg-muted text-foreground"
          )}
        >
          <RefreshCw className={cn("h-4 w-4", reinstalling && "animate-spin")} />
          {reinstallDone ? "Done! Reloading…" : reinstalling ? "Reinstalling…" : "Reinstall / Clear Cache"}
        </button>
      </div>
    );
  }

  // iOS — can't trigger prompt natively
  if (isIos && !promptEvent) {
    return (
      <div className="rounded-3xl bg-secondary/80 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Smartphone className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold">Install on iPhone / iPad</p>
            <p className="text-xs font-semibold text-muted-foreground">
              Tap <span className="font-extrabold text-foreground">Share</span> → <span className="font-extrabold text-foreground">Add to Home Screen</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Android / Chrome — native prompt available
  if (promptEvent) {
    return (
      <div className="rounded-3xl bg-secondary/80 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Download className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold">Install App</p>
            <p className="text-xs font-semibold text-muted-foreground">
              Add to home screen — native app feel + better notifications
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-sm font-extrabold text-primary-foreground transition-all active:scale-95 shadow-sm"
        >
          <Download className="h-4 w-4" />
          Install Tanmay OS
        </button>
      </div>
    );
  }

  // Reinstall-only fallback (no prompt available but not standalone — e.g. desktop browser)
  return (
    <div className="rounded-3xl bg-secondary/80 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <RefreshCw className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold">Reinstall / Clear Cache</p>
          <p className="text-xs font-semibold text-muted-foreground">
            Unregisters the service worker, wipes cache, and reloads fresh
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleReinstall}
        disabled={reinstalling || reinstallDone}
        className={cn(
          "w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-extrabold transition-all active:scale-95",
          reinstallDone
            ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
            : "bg-card border-2 border-border hover:bg-muted text-foreground"
        )}
      >
        <RefreshCw className={cn("h-4 w-4", reinstalling && "animate-spin")} />
        {reinstallDone ? "Done! Reloading…" : reinstalling ? "Clearing…" : "Clear Cache & Reload"}
      </button>
    </div>
  );
}
