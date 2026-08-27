"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { TaskModal } from "@/components/features/TaskModal";
import { toDateInputValue } from "@/lib/task-dates";

/** Floating add-task button for mobile — Duolingo-style primary action. */
export function MobileTaskFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hide =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/settings");

  if (hide) return null;

  const today = toDateInputValue(new Date().toISOString());
  const mustDo = pathname === "/today";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-[55] lg:hidden bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground border-b-4 border-[color:var(--primary-deep)] shadow-[var(--shadow-lg)] active:border-b-0 active:translate-y-1"
        aria-label="Add task"
      >
        <Plus className="h-7 w-7" strokeWidth={3} />
      </button>
      <TaskModal
        isOpen={open}
        onOpenChange={setOpen}
        defaults={{
          isMustDo: mustDo,
          endDate: today,
          startDate: today,
        }}
      />
    </>
  );
}
