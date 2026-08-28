"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Delete } from "lucide-react";
import { PinDigits } from "@/components/pin/PinDigits";
import { usePinKeyboard } from "@/components/pin/usePinKeyboard";
import { isValidPinFormat } from "@/lib/pin-lock";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

type Step = "create" | "confirm";

/**
 * Two-step PIN create: enter PIN (4–10) → confirm same PIN again.
 */
export function PinSetupScreen({
  onComplete,
  onCancel,
  title = "Set your PIN",
  subtitle = "Choose 4–10 digits. You’ll enter it twice to confirm.",
}: {
  onComplete: (pin: string) => Promise<void> | void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
}) {
  const [step, setStep] = useState<Step>("create");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const confirmingRef = useRef(false);

  const active = step === "create" ? pin : confirm;

  const finish = useCallback(
    async (finalPin: string) => {
      setBusy(true);
      try {
        await onComplete(finalPin);
        setSuccess(true);
      } catch {
        setError("Could not save PIN");
      } finally {
        setBusy(false);
        confirmingRef.current = false;
      }
    },
    [onComplete]
  );

  const append = useCallback(
    (digit: string) => {
      if (busy || success) return;
      setError(null);

      if (step === "create") {
        setPin((p) => (p.length >= 10 ? p : p + digit));
        return;
      }

      setConfirm((p) => {
        if (p.length >= pin.length) return p;
        const next = p + digit;
        if (next.length === pin.length && !confirmingRef.current) {
          confirmingRef.current = true;
          queueMicrotask(() => {
            if (next !== pin) {
              setError("PINs don’t match — enter again");
              setConfirm("");
              confirmingRef.current = false;
              return;
            }
            void finish(pin);
          });
        }
        return next;
      });
    },
    [busy, success, step, pin, finish]
  );

  const backspace = useCallback(() => {
    if (busy || success) return;
    setError(null);
    if (step === "create") setPin((p) => p.slice(0, -1));
    else setConfirm((p) => p.slice(0, -1));
  }, [busy, success, step]);

  const advance = useCallback(async () => {
    if (busy || success) return;
    if (step === "create") {
      if (!isValidPinFormat(pin)) {
        setError("PIN must be 4–10 digits");
        return;
      }
      setConfirm("");
      setError(null);
      setStep("confirm");
      return;
    }
    if (confirm.length !== pin.length) {
      setError(`Enter all ${pin.length} digits to confirm`);
      return;
    }
    if (confirm !== pin) {
      setError("PINs don’t match — enter again");
      setConfirm("");
      return;
    }
    await finish(pin);
  }, [busy, success, step, pin, confirm, finish]);

  usePinKeyboard({
    enabled: !busy && !success,
    onDigit: append,
    onBackspace: backspace,
    onEnter: () => void advance(),
  });

  useEffect(() => {
    confirmingRef.current = false;
  }, [step]);

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-5 text-center"
      >
        <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-3xl border-2 border-border shadow-[var(--shadow-md)]">
          <Image src="/logo.png" alt="Tanmay OS" fill className="object-cover" sizes="64px" priority />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{title}</h1>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">{subtitle}</p>
          <p className="mt-3 text-xs font-extrabold uppercase tracking-wider text-primary">
            {step === "create" ? "1 / 2 · Create PIN" : `2 / 2 · Confirm (${pin.length} digits)`}
          </p>
          <p className="mt-1 text-[11px] font-bold text-muted-foreground">
            {step === "create"
              ? `${pin.length}/10 · min 4 digits · keyboard OK`
              : "Type the same PIN again"}
          </p>
        </div>

        <PinDigits
          length={step === "create" ? Math.max(pin.length, 4) : pin.length}
          maxHint={step === "create" ? 10 : pin.length}
          value={active}
          error={Boolean(error)}
          success={success}
        />

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key={error}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-bold text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Always-focused capture for mobile/desktop keyboards */}
        <input
          data-pin-input="1"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          className="mx-auto block h-0 w-0 opacity-0"
          value={active}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (step === "create") {
              setPin(digits.slice(0, 10));
              setError(null);
            } else {
              const next = digits.slice(0, pin.length);
              setConfirm(next);
              setError(null);
              if (next.length === pin.length) {
                if (next !== pin) {
                  setError("PINs don’t match — enter again");
                  setConfirm("");
                } else {
                  void finish(pin);
                }
              }
            }
          }}
          autoFocus
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
                  className="flex h-14 items-center justify-center rounded-2xl bg-secondary text-foreground active:scale-95"
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
                className="flex h-14 items-center justify-center rounded-2xl bg-secondary text-xl font-black active:scale-95"
              >
                {k}
              </button>
            );
          })}
        </div>

        {step === "create" && (
          <button
            type="button"
            disabled={pin.length < 4 || busy}
            onClick={() => void advance()}
            className={cn(
              "h-12 w-full rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground border-b-4 border-[color:var(--primary-deep)] active:border-b-0 active:translate-y-1 disabled:opacity-40"
            )}
          >
            Continue to confirm
          </button>
        )}

        {step === "confirm" && (
          <button
            type="button"
            className="text-xs font-bold text-muted-foreground underline"
            onClick={() => {
              setStep("create");
              setConfirm("");
              setError(null);
            }}
          >
            Start over
          </button>
        )}

        {onCancel && (
          <div>
            <button
              type="button"
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors pt-2"
              onClick={onCancel}
            >
              Cancel & keep screen lock off
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
