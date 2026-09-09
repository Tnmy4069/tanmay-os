"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { markForcePinReset } from "@/lib/pin-lock";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pinReset = searchParams.get("pinReset") === "1";
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password: pin,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        if (pinReset) markForcePinReset();
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 shadow-[var(--shadow-md)] sm:p-8">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-4 h-14 w-14 overflow-hidden rounded-3xl border-2 border-border shadow-[var(--shadow-md)]">
          <Image src="/logo.png" alt="Tanmay OS" fill className="object-cover" sizes="56px" priority />
        </div>
        <h1 className="type-h1">Tanmay OS</h1>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {pinReset ? "Sign in again to reset your app PIN." : "Sign in and keep your streak going."}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-extrabold" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-extrabold" htmlFor="pin">
            PIN (4-6 digits)
          </label>
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            minLength={4}
            maxLength={6}
            pattern="[0-9]*"
          />
        </div>
        {error && <p className="text-sm font-extrabold text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : pinReset ? "Verify & reset PIN" : "Continue"}
        </Button>
        <p className="text-center text-sm font-semibold text-muted-foreground">
          No account?{" "}
          <Link href="/register" className="font-extrabold text-primary hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4 pb-[env(safe-area-inset-bottom)]">
      <Suspense
        fallback={
          <div className="h-40 w-full max-w-md animate-pulse rounded-3xl bg-card" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
