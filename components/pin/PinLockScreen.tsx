"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Delete } from "lucide-react";
import { signOut } from "next-auth/react";
import { PinDigits } from "@/components/pin/PinDigits";
import { usePinKeyboard } from "@/components/pin/usePinKeyboard";
import { markForcePinReset, readPinRecord, verifyPin } from "@/lib/pin-lock";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

export function PinLockScreen({
  userId,
  onUnlock,
}: {
  userId: string;
  onUnlock: () => void;
}) {
  const record = readPinRecord(userId);
  const length = record?.length || 4;
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const tryUnlock = useCallback(
    async (nextPin: string) => {
      if (busy || success || !record) return;
      if (nextPin.length < length) return;
      setBusy(true);
      const ok = await verifyPin(userId, nextPin);
      if (ok) {
        setSuccess(true);
        setError(false);
        window.setTimeout(() => onUnlock(), 320);
      } else {
        setError(true);
        window.setTimeout(() => {
          setPin("");
          setError(false);
          setBusy(false);
        }, 450);
        return;
      }
      setBusy(false);
    },
    [busy, success, record, length, userId, onUnlock]
  );

  const append = useCallback(
    (digit: string) => {
      if (busy || success) return;
      setError(false);
      setPin((prev) => {
        if (prev.length >= length) return prev;
        const next = prev + digit;
        if (next.length === length) void tryUnlock(next);
        return next;
      });
    },
    [busy, success, length, tryUnlock]
  );

  const backspace = useCallback(() => {
    if (busy || success) return;
    setError(false);
    setPin((p) => p.slice(0, -1));
  }, [busy, success]);

  usePinKeyboard({
    enabled: !busy && !success,
    onDigit: append,
    onBackspace: backspace,
  });

  async function forgotPin() {
    markForcePinReset();
    await signOut({ callbackUrl: "/login?pinReset=1" });
  }

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-4 py-8">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{
          background: [
            "radial-gradient(600px 320px at 20% 10%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 60%)",
            "radial-gradient(600px 320px at 80% 20%, color-mix(in oklab, var(--info) 16%, transparent), transparent 60%)",
            "radial-gradient(600px 320px at 40% 80%, color-mix(in oklab, var(--streak) 14%, transparent), transparent 60%)",
            "radial-gradient(600px 320px at 20% 10%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 60%)",
          ],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: success ? 1.02 : 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="relative w-full max-w-sm space-y-6 text-center"
      >
        <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-3xl border-2 border-border bg-card shadow-[var(--shadow-md)]">
          <Image src="/logo.png" alt="Tanmay OS" fill className="object-cover" sizes="64px" priority />
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight">App Locked</h1>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">Enter your PIN to continue</p>
          <p className="mt-1 text-[11px] font-bold text-muted-foreground">
            {length} digits · keyboard OK
          </p>
        </div>

        <PinDigits length={length} value={pin} error={error} success={success} />

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-bold text-destructive"
            >
              Incorrect PIN
            </motion.p>
          )}
          {success && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-bold text-primary"
            >
              Unlocked
            </motion.p>
          )}
        </AnimatePresence>

        <input
          data-pin-input="1"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          className="mx-auto block h-0 w-0 opacity-0"
          value={pin}
          autoFocus
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, length);
            setPin(digits);
            setError(false);
            if (digits.length === length) void tryUnlock(digits);
          }}
        />

        <div className="mx-auto grid max-w-[280px] grid-cols-3 gap-2.5">
          {KEYS.map((k, idx) => {
            if (k === "") return <div key={`empty-${idx}`} />;
            if (k === "back") {
              return (
                <button
                  key="back"
                  type="button"
                  onClick={backspace}
                  className="flex h-14 items-center justify-center rounded-2xl border-2 border-border bg-card/80 text-foreground backdrop-blur active:scale-95"
                  aria-label="Delete"
                >
                  <Delete className="h-5 w-5" />
                </button>
              );
            }
            return (
              <button
                key={k}
                type="button"
                onClick={() => append(k)}
                className="flex h-14 items-center justify-center rounded-2xl border-2 border-border bg-card/80 text-xl font-black backdrop-blur active:scale-95"
              >
                {k}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void forgotPin()}
          className="text-sm font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Forgot PIN?
        </button>
      </motion.div>
    </div>
  );
}
