"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  clearPin,
  consumeForcePinReset,
  hasPinConfigured,
  isAppLocked,
  isPinLockEnabled,
  peekForcePinReset,
  savePin,
  setAppLocked,
  setPinLockEnabled,
  subscribePinEvents,
} from "@/lib/pin-lock";
import { PinLockScreen } from "@/components/pin/PinLockScreen";
import { PinSetupScreen } from "@/components/pin/PinSetupScreen";

type PinPhase = "booting" | "setup" | "locked" | "unlocked" | "idle";

type PinLockContextValue = {
  phase: PinPhase;
  lockApp: () => void;
  unlockApp: () => void;
  isPinConfigured: boolean;
  isPinEnabled: boolean;
  setPinEnabled: (enabled: boolean) => void;
  openPinSetup: () => void;
  cancelPinSetup: () => void;
};

const PinLockContext = createContext<PinLockContextValue>({
  phase: "idle",
  lockApp: () => undefined,
  unlockApp: () => undefined,
  isPinConfigured: false,
  isPinEnabled: false,
  setPinEnabled: () => undefined,
  openPinSetup: () => undefined,
  cancelPinSetup: () => undefined,
});

export function usePinLock() {
  return useContext(PinLockContext);
}

function isAuthPublicPath(pathname: string | null) {
  if (!pathname) return false;
  return pathname.startsWith("/login") || pathname.startsWith("/register");
}

export function PinLockProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const userId = session?.user?.id as string | undefined;
  const publicPath = isAuthPublicPath(pathname);

  const [phase, setPhase] = useState<PinPhase>("booting");
  const [configured, setConfigured] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const lastUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (userId) lastUserIdRef.current = userId;
  }, [userId]);

  // Re-lock when the session ends (sign out) so next login asks for PIN if enabled
  useEffect(() => {
    if (status === "unauthenticated" && lastUserIdRef.current) {
      try {
        if (isPinLockEnabled(lastUserIdRef.current) && hasPinConfigured(lastUserIdRef.current)) {
          setAppLocked(lastUserIdRef.current, true);
        }
      } catch {
        // ignore
      }
    }
  }, [status]);

  const refreshPhase = useCallback(() => {
    if (status === "loading") {
      setPhase("booting");
      return;
    }
    if (status !== "authenticated" || !userId || publicPath) {
      setPhase("idle");
      setConfigured(false);
      setEnabled(false);
      return;
    }

    const forceReset = peekForcePinReset();
    if (forceReset) {
      clearPin(userId);
      consumeForcePinReset();
      setConfigured(false);
      setEnabled(false);
      setPhase("unlocked");
      return;
    }

    const hasPin = hasPinConfigured(userId);
    const lockEnabled = isPinLockEnabled(userId);
    setConfigured(hasPin);
    setEnabled(lockEnabled);

    if (!lockEnabled) {
      setPhase("unlocked");
      return;
    }

    if (!hasPin) {
      setPhase("setup");
      return;
    }

    setPhase(isAppLocked(userId) ? "locked" : "unlocked");
  }, [status, userId, publicPath]);

  useEffect(() => {
    refreshPhase();
  }, [refreshPhase]);

  useEffect(() => {
    if (!userId || publicPath) return;
    return subscribePinEvents(userId, refreshPhase);
  }, [userId, publicPath, refreshPhase]);

  const lockApp = useCallback(() => {
    if (!userId || !isPinLockEnabled(userId) || !hasPinConfigured(userId)) return;
    setAppLocked(userId, true);
    setPhase((p) => (p === "setup" || p === "booting" ? p : "locked"));
  }, [userId]);

  const unlockApp = useCallback(() => {
    if (!userId) return;
    setAppLocked(userId, false);
    setPhase("unlocked");
  }, [userId]);

  const openPinSetup = useCallback(() => {
    setPhase("setup");
  }, []);

  const cancelPinSetup = useCallback(() => {
    if (!userId) return;
    setPhase("unlocked");
    if (!hasPinConfigured(userId)) {
      setPinLockEnabled(userId, false);
      setEnabled(false);
    }
  }, [userId]);

  const setPinEnabled = useCallback(
    (nextEnabled: boolean) => {
      if (!userId) return;
      if (nextEnabled) {
        if (hasPinConfigured(userId)) {
          setPinLockEnabled(userId, true);
          setEnabled(true);
          setPhase("unlocked");
        } else {
          openPinSetup();
        }
      } else {
        setPinLockEnabled(userId, false);
        setEnabled(false);
        unlockApp();
      }
    },
    [userId, openPinSetup, unlockApp]
  );

  // Require PIN after cold start / PWA reopen only if screen lock is enabled
  useEffect(() => {
    if (!userId || publicPath) return;
    if (!isPinLockEnabled(userId) || !hasPinConfigured(userId)) return;
    setAppLocked(userId, true);
    setPhase((p) => (p === "setup" ? p : "locked"));
  }, [userId, publicPath]);

  // Re-lock whenever the tab/PWA goes to background if enabled
  useEffect(() => {
    if (!userId || publicPath) return;

    const lockIfConfigured = () => {
      if (!isPinLockEnabled(userId) || !hasPinConfigured(userId)) return;
      setAppLocked(userId, true);
      setPhase((p) => (p === "setup" || p === "booting" ? p : "locked"));
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") lockIfConfigured();
      else if (document.visibilityState === "visible" && isPinLockEnabled(userId) && isAppLocked(userId)) {
        setPhase((p) => (p === "setup" || p === "booting" ? p : "locked"));
      }
    };

    const onPageHide = () => lockIfConfigured();
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) lockIfConfigured();
    };
    const onFreeze = () => lockIfConfigured();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("freeze", onFreeze);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("freeze", onFreeze);
    };
  }, [userId, publicPath]);

  const onSetupComplete = useCallback(
    async (pin: string) => {
      if (!userId) return;
      await savePin(userId, pin);
      setPinLockEnabled(userId, true);
      setConfigured(true);
      setEnabled(true);
      setPhase("unlocked");
    },
    [userId]
  );

  const value = useMemo(
    () => ({
      phase,
      lockApp,
      unlockApp,
      isPinConfigured: configured,
      isPinEnabled: enabled,
      setPinEnabled,
      openPinSetup,
      cancelPinSetup,
    }),
    [phase, lockApp, unlockApp, configured, enabled, setPinEnabled, openPinSetup, cancelPinSetup]
  );

  // While locked/setup, keep shell mounted (sync continues) but inert for interaction
  const blockUi =
    status === "authenticated" &&
    Boolean(userId) &&
    !publicPath &&
    (phase === "setup" || phase === "locked" || phase === "booting");

  return (
    <PinLockContext.Provider value={value}>
      <div
        {...(blockUi ? { inert: true } : {})}
        aria-hidden={blockUi || undefined}
        className={blockUi ? "pointer-events-none select-none max-h-dvh overflow-hidden" : undefined}
      >
        {children}
      </div>

      <AnimatePresence>
        {blockUi && (
          <motion.div
            key={phase === "booting" ? "boot" : phase}
            role="dialog"
            aria-modal="true"
            aria-label={phase === "setup" ? "Set PIN" : phase === "locked" ? "App locked" : "Loading"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background"
          >
            {phase === "booting" && (
              <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-pulse rounded-2xl bg-primary/30" />
              </div>
            )}
            {phase === "setup" && userId && (
              <PinSetupScreen
                title="Set your PIN"
                subtitle="Create a 4–10 digit PIN for this device. Unlock works offline — no login needed."
                onComplete={onSetupComplete}
                onCancel={cancelPinSetup}
              />
            )}
            {phase === "locked" && userId && (
              <PinLockScreen userId={userId} onUnlock={unlockApp} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PinLockContext.Provider>
  );
}
