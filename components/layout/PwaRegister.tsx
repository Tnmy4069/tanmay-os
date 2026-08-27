"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function applyWaitingWorker(reg: ServiceWorkerRegistration) {
  const waiting = reg.waiting;
  if (!waiting) return;
  waiting.postMessage({ type: "SKIP_WAITING" });
}

/**
 * Registers the service worker, polls for updates after deploys,
 * and reloads the app once the new worker takes control.
 */
function useServiceWorkerAutoUpdate() {
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    let refreshing = false;
    // First-time install also fires controllerchange — skip that reload.
    let hadController = Boolean(navigator.serviceWorker.controller);

    const onControllerChange = () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      if (refreshing) return;
      refreshing = true;
      setUpdating(true);
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let intervalId = 0;
    const VERSION_KEY = "tanmay-os-app-version";

    const checkDeployVersion = async () => {
      try {
        const res = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { v?: string };
        if (!data.v) return;
        const prev = sessionStorage.getItem(VERSION_KEY);
        if (prev && prev !== data.v) {
          sessionStorage.setItem(VERSION_KEY, data.v);
          setUpdating(true);
          window.location.reload();
          return;
        }
        sessionStorage.setItem(VERSION_KEY, data.v);
      } catch {
        // ignore
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        navigator.serviceWorker.getRegistration().then((reg) => reg?.update().catch(() => undefined));
        checkDeployVersion();
      }
    };
    const onFocus = () => {
      navigator.serviceWorker.getRegistration().then((reg) => reg?.update().catch(() => undefined));
      checkDeployVersion();
    };

    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
        if (cancelled) return;

        applyWaitingWorker(reg);

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state !== "installed") return;
            if (navigator.serviceWorker.controller) {
              setUpdating(true);
              applyWaitingWorker(reg);
            }
          });
        });

        if (cancelled) return;

        intervalId = window.setInterval(() => {
          reg.update().catch(() => undefined);
          checkDeployVersion();
        }, 60 * 1000);

        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onFocus);
        checkDeployVersion();
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return updating;
}

export function PwaRegister() {
  const updating = useServiceWorkerAutoUpdate();
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
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

  if (updating) {
    return (
      <div className="fixed inset-x-3 z-[70] bottom-[calc(5.75rem+env(safe-area-inset-bottom))] lg:bottom-4 lg:right-4 lg:inset-x-auto lg:w-80 rounded-3xl border-2 border-primary/40 bg-card p-3 shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-extrabold">Updating Tanmay OS…</p>
            <p className="text-xs font-semibold text-muted-foreground">Loading the latest version</p>
          </div>
        </div>
      </div>
    );
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
