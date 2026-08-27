"use client";

import { SessionProvider } from "next-auth/react";
import { PwaRegister } from "@/components/layout/PwaRegister";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { OfflineSyncBoot } from "@/components/layout/OfflineSyncBoot";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <OfflineSyncBoot />
        <OfflineBanner />
        {children}
        <PwaRegister />
      </ThemeProvider>
    </SessionProvider>
  );
}
