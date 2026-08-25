"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth.actions";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await logoutAction();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <LogOut className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
