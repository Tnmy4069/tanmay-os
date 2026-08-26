type Listener = (online: boolean) => void;

const listeners = new Set<Listener>();

export function isOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function subscribeOnline(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  const online = isOnline();
  listeners.forEach((l) => l(online));
}

if (typeof window !== "undefined") {
  window.addEventListener("online", emit);
  window.addEventListener("offline", emit);
}
