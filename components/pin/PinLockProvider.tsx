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
  peekForcePinReset,
  savePin,
  setAppLocked,
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
};

const PinLockContext = createContext<PinLockContextValue>({
  phase: "idle",
  lockApp: () => undefined,
  unlockApp: () => undefined,
  isPinConfigured: false,
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
  const lastUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (userId) lastUserIdRef.current = userId;
  }, [userId]);

  // Re-lock when the session ends (sign out) so next login asks for PIN
  useEffect(() => {
    if (status === "unauthenticated" && lastUserIdRef.current) {
      try {
        if (hasPinConfigured(lastUserIdRef.current)) {
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
      return;
    }

    const forceReset = peekForcePinReset();
    if (forceReset) {
      clearPin(userId);
      consumeForcePinReset();
      setConfigured(false);
      setPhase("setup");
      return;
    }

    const hasPin = hasPinConfigured(userId);
    setConfigured(hasPin);
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
    if (!userId || !hasPinConfigured(userId)) return;
    setAppLocked(userId, true);
    setPhase("locked");
  }, [userId]);

  const unlockApp = useCallback(() => {
    if (!userId) return;
    setAppLocked(userId, false);
    setPhase("unlocked");
  }, [userId]);

  const onSetupComplete = useCallback(
    async (pin: string) => {
      if (!userId) return;
      await savePin(userId, pin);
      setConfigured(true);
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
    }),
    [phase, lockApp, unlockApp, configured]
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
