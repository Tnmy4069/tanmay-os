"use client";

import { SessionProvider } from "next-auth/react";
import { PwaRegister } from "@/components/layout/PwaRegister";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { OfflineSyncBoot } from "@/components/layout/OfflineSyncBoot";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OfflineSyncBoot />
      <OfflineBanner />
      {children}
      <PwaRegister />
    </SessionProvider>
  );
}
