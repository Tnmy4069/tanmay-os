/** Local app PIN — device/browser convenience lock (never sent to the server). */

export type PinRecord = {
  userId: string;
  salt: string;
  hash: string;
  length: number;
  updatedAt: number;
};

const PIN_PREFIX = "tanmay-os-pin-v1:";
const LOCK_PREFIX = "tanmay-os-pin-locked-v1:";
const ENABLED_PREFIX = "tanmay-os-pin-enabled-v1:";
const RESET_FLAG = "tanmay-os-pin-force-reset";
const CHANNEL = "tanmay-os-pin-lock";

function pinKey(userId: string) {
  return `${PIN_PREFIX}${userId}`;
}

function lockKey(userId: string) {
  return `${LOCK_PREFIX}${userId}`;
}

function enabledKey(userId: string) {
  return `${ENABLED_PREFIX}${userId}`;
}

export function isPinLockEnabled(userId: string): boolean {
  if (typeof window === "undefined") return false;
  const val = localStorage.getItem(enabledKey(userId));
  if (val !== null) return val === "1";
  return hasPinConfigured(userId);
}

export function setPinLockEnabled(userId: string, enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(enabledKey(userId), enabled ? "1" : "0");
  if (!enabled) {
    localStorage.setItem(lockKey(userId), "0");
  }
  broadcastPinEvent({ type: enabled ? "unlocked" : "cleared", userId });
}

function bytesToHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes.buffer);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`tanmay-os|${salt}|${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(digest);
}

export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,10}$/.test(pin);
}

export function readPinRecord(userId: string): PinRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(pinKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PinRecord;
    if (!parsed?.salt || !parsed?.hash || !parsed?.userId || parsed.userId !== userId) {
      localStorage.removeItem(pinKey(userId));
      return null;
    }
    if (!parsed.length || parsed.length < 4 || parsed.length > 10) {
      localStorage.removeItem(pinKey(userId));
      return null;
    }
    return parsed;
  } catch {
    try {
      localStorage.removeItem(pinKey(userId));
    } catch {
      // ignore
    }
    return null;
  }
}

export function hasPinConfigured(userId: string): boolean {
  return Boolean(readPinRecord(userId));
}

export async function savePin(userId: string, pin: string): Promise<void> {
  if (!isValidPinFormat(pin)) throw new Error("PIN must be 4–10 digits");
  const salt = randomSalt();
  const hash = await hashPin(pin, salt);
  const record: PinRecord = {
    userId,
    salt,
    hash,
    length: pin.length,
    updatedAt: Date.now(),
  };
  localStorage.setItem(pinKey(userId), JSON.stringify(record));
  setAppLocked(userId, false);
  broadcastPinEvent({ type: "unlocked", userId });
}

export function clearPin(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(pinKey(userId));
  localStorage.removeItem(lockKey(userId));
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const record = readPinRecord(userId);
  if (!record) return false;
  if (pin.length !== record.length) return false;
  const hash = await hashPin(pin, record.salt);
  // Constant-ish compare
  if (hash.length !== record.hash.length) return false;
  let ok = 0;
  for (let i = 0; i < hash.length; i++) {
    ok |= hash.charCodeAt(i) ^ record.hash.charCodeAt(i);
  }
  return ok === 0;
}

/** Locked by default when a PIN exists and the flag is missing or "1". */
export function isAppLocked(userId: string): boolean {
  if (typeof window === "undefined") return true;
  if (!hasPinConfigured(userId)) return false;
  const flag = localStorage.getItem(lockKey(userId));
  return flag !== "0";
}

export function setAppLocked(userId: string, locked: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(lockKey(userId), locked ? "1" : "0");
  broadcastPinEvent({ type: locked ? "locked" : "unlocked", userId });
}

export function markForcePinReset() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RESET_FLAG, "1");
}

export function consumeForcePinReset(): boolean {
  if (typeof window === "undefined") return false;
  const v = sessionStorage.getItem(RESET_FLAG) === "1";
  if (v) sessionStorage.removeItem(RESET_FLAG);
  return v;
}

export function peekForcePinReset(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(RESET_FLAG) === "1";
}

type PinEvent = { type: "locked" | "unlocked" | "cleared"; userId: string };

function broadcastPinEvent(event: PinEvent) {
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.postMessage(event);
    bc.close();
  } catch {
    // ignore
  }
  try {
    // storage event fallback for other tabs
    localStorage.setItem(`${CHANNEL}:ping`, String(Date.now()));
  } catch {
    // ignore
  }
}

export function subscribePinEvents(userId: string, onChange: () => void) {
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = (ev) => {
      const data = ev.data as PinEvent | undefined;
      if (data?.userId === userId) onChange();
    };
  } catch {
    // ignore
  }
  const onStorage = (e: StorageEvent) => {
    if (!e.key) return;
    if (
      e.key === lockKey(userId) ||
      e.key === pinKey(userId) ||
      e.key === enabledKey(userId) ||
      e.key.startsWith(`${CHANNEL}:`)
    ) {
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("storage", onStorage);
    try {
      bc?.close();
    } catch {
      // ignore
    }
  };
}
