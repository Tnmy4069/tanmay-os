"use client";

import { SessionProvider } from "next-auth/react";
import { PwaRegister } from "@/components/layout/PwaRegister";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { OfflineSyncBoot } from "@/components/layout/OfflineSyncBoot";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { NotificationBoot } from "@/components/layout/NotificationBoot";
import { MobileTaskFab } from "@/components/layout/MobileTaskFab";
import { NotifyNudge } from "@/components/layout/NotifyNudge";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <OfflineSyncBoot />
        <NotificationBoot />
        <OfflineBanner />
        {children}
        <NotifyNudge />
        <MobileTaskFab />
        <PwaRegister />
      </ThemeProvider>
    </SessionProvider>
  );
}
