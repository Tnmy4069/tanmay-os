"use client";

import { useEffect, useRef, useState } from "react";

const TZ = "Asia/Kolkata";

function format(date: Date) {
  return date.toLocaleTimeString("en-IN", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function ServerClock() {
  const [time, setTime] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const offsetRef = useRef(0); // server ms - client ms

  useEffect(() => {
    const fetchAndStart = async () => {
      try {
        const before = Date.now();
        const res = await fetch("/api/server-time");
        const after = Date.now();
        const { ts } = await res.json();
        // Use midpoint RTT to estimate offset
        offsetRef.current = ts - Math.round((before + after) / 2);
      } catch {
        offsetRef.current = 0;
      }

      const tick = () => {
        const now = new Date(Date.now() + offsetRef.current);
        setTime(format(now));
        setDate(formatDate(now));
      };

      tick();
      const id = setInterval(tick, 1000);
      return id;
    };

    let intervalId: ReturnType<typeof setInterval> | undefined;
    fetchAndStart().then((id) => {
      intervalId = id;
    });

    return () => {
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, []);

  if (!time) return null;

  return (
    <div className="mx-2 mb-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
          Server Time
        </span>
      </div>
      <p className="font-mono text-sm font-medium text-foreground tabular-nums leading-none">
        {time}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{date} · IST</p>
    </div>
  );
}
