"use client";

import { SessionProvider } from "next-auth/react";
import { PwaRegister } from "@/components/layout/PwaRegister";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <PwaRegister />
    </SessionProvider>
  );
}
