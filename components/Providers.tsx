"use client";

import { SessionProvider } from "next-auth/react";
import { PwaRegister } from "@/components/layout/PwaRegister";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { OfflineSyncBoot } from "@/components/layout/OfflineSyncBoot";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { NotificationBoot } from "@/components/layout/NotificationBoot";
import { MobileTaskFab } from "@/components/layout/MobileTaskFab";
import { NotifyNudge } from "@/components/layout/NotifyNudge";
import { PinLockProvider } from "@/components/pin/PinLockProvider";
import { MobileFabProvider } from "@/lib/mobile-fab-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <PinLockProvider>
          <MobileFabProvider>
            <OfflineSyncBoot />
            <NotificationBoot />
            <OfflineBanner />
            {children}
            <NotifyNudge />
            <MobileTaskFab />
            <PwaRegister />
          </MobileFabProvider>
        </PinLockProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
