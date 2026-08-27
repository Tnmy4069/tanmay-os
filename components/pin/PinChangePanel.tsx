"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Delete, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { PinDigits } from "@/components/pin/PinDigits";
import { usePinKeyboard } from "@/components/pin/usePinKeyboard";
import { isValidPinFormat, readPinRecord, savePin, verifyPin } from "@/lib/pin-lock";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

type Step = "old" | "create" | "confirm";

/** Change PIN: old → new → confirm new. */
export function PinChangePanel({ onClose, onChanged }: { onClose: () => void; onChanged?: () => void }) {
  const { data } = useSession();
  const userId = data?.user?.id as string | undefined;

  const [step, setStep] = useState<Step>("old");
  const [oldPin, setOldPin] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oldLen] = useState(() => (userId ? readPinRecord(userId)?.length ?? 4 : 4));

  const active = step === "old" ? oldPin : step === "create" ? pin : confirm;
  const slotLen = step === "old" ? oldLen : step === "create" ? Math.max(pin.length, 4) : pin.length;

  const append = useCallback(
    (digit: string) => {
      if (busy) return;
      setError(null);
      if (step === "old") {
        setOldPin((p) => {
          if (p.length >= oldLen) return p;
          const next = p + digit;
          if (next.length === oldLen && userId) {
            queueMicrotask(async () => {
              const ok = await verifyPin(userId, next);
              if (!ok) {
                setError("Wrong current PIN");
                setOldPin("");
                return;
              }
              setStep("create");
              setPin("");
              setConfirm("");
            });
          }
          return next;
        });
        return;
      }
      if (step === "create") {
        setPin((p) => (p.length >= 10 ? p : p + digit));
        return;
      }
      setConfirm((p) => {
        if (p.length >= pin.length) return p;
        const next = p + digit;
        if (next.length === pin.length && userId) {
          queueMicrotask(async () => {
            if (next !== pin) {
              setError("New PINs don’t match");
              setConfirm("");
              return;
            }
            setBusy(true);
            try {
              await savePin(userId, pin);
              onChanged?.();
              onClose();
            } catch {
              setError("Could not save PIN");
            } finally {
              setBusy(false);
            }
          });
        }
        return next;
      });
    },
    [busy, step, oldLen, userId, pin, onChanged, onClose]
  );

  const backspace = useCallback(() => {
    if (busy) return;
    setError(null);
    if (step === "old") setOldPin((p) => p.slice(0, -1));
    else if (step === "create") setPin((p) => p.slice(0, -1));
    else setConfirm((p) => p.slice(0, -1));
  }, [busy, step]);

  const onEnter = useCallback(async () => {
    if (busy || !userId) return;
    if (step === "create") {
      if (!isValidPinFormat(pin)) {
        setError("New PIN must be 4–10 digits");
        return;
      }
      setConfirm("");
      setStep("confirm");
      return;
    }
  }, [busy, userId, step, pin]);

  usePinKeyboard({
    enabled: !busy,
    onDigit: append,
    onBackspace: backspace,
    onEnter: () => void onEnter(),
  });

  const stepLabel =
    step === "old" ? "1 / 3 · Current PIN" : step === "create" ? "2 / 3 · New PIN" : `3 / 3 · Confirm (${pin.length} digits)`;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-t-[1.75rem] border-2 border-border bg-card p-5 shadow-[var(--shadow-lg)] sm:rounded-3xl sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:bg-secondary"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4 text-center">
          <div>
            <h2 className="text-lg font-black tracking-tight">Change PIN</h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Old PIN, then new PIN twice
            </p>
            <p className="mt-2 text-xs font-extrabold uppercase tracking-wider text-primary">{stepLabel}</p>
          </div>

          <PinDigits
            length={slotLen}
            maxHint={step === "create" ? 10 : slotLen}
            value={active}
            error={Boolean(error)}
          />

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key={error}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-bold text-destructive"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <input
            data-pin-input="1"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            className="mx-auto block h-0 w-0 opacity-0"
            value={active}
            autoFocus
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              setError(null);
              if (step === "old") {
                const next = digits.slice(0, oldLen);
                setOldPin(next);
                if (next.length === oldLen && userId) {
                  void verifyPin(userId, next).then((ok) => {
                    if (!ok) {
                      setError("Wrong current PIN");
                      setOldPin("");
                    } else {
                      setStep("create");
                      setPin("");
                      setConfirm("");
                    }
                  });
                }
              } else if (step === "create") {
                setPin(digits.slice(0, 10));
              } else {
                const next = digits.slice(0, pin.length);
                setConfirm(next);
                if (next.length === pin.length && userId) {
                  if (next !== pin) {
                    setError("New PINs don’t match");
                    setConfirm("");
                  } else {
                    void (async () => {
                      setBusy(true);
                      try {
                        await savePin(userId, pin);
                        onChanged?.();
                        onClose();
                      } catch {
                        setError("Could not save PIN");
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }
                }
              }
            }}
          />

          <div className="mx-auto grid max-w-[280px] grid-cols-3 gap-2">
            {KEYS.map((k, idx) => {
              if (k === "") return <div key={`e-${idx}`} />;
              if (k === "back") {
                return (
                  <button
                    key="back"
                    type="button"
                    onClick={backspace}
                    className="flex h-12 items-center justify-center rounded-2xl bg-secondary active:scale-95"
                    aria-label="Delete"
                  >
                    <Delete className="h-4 w-4" />
                  </button>
                );
              }
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => append(k)}
                  className="flex h-12 items-center justify-center rounded-2xl bg-secondary text-lg font-black active:scale-95"
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
              onClick={() => void onEnter()}
              className={cn(
                "h-11 w-full rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground disabled:opacity-40"
              )}
            >
              Continue to confirm
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
