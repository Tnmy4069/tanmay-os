"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveSpaceNoteAction } from "@/app/actions/space.actions";

export function CustomSpaceNotes({
  coreSlug,
  itemSlug,
  initialNotes,
}: {
  coreSlug: string;
  itemSlug: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={10}
        placeholder="Notes, goals, links — this space is yours."
        className="w-full rounded-2xl border border-input bg-background px-3 py-3 text-base sm:text-sm min-h-40"
      />
      <Button
        className="w-full sm:w-auto"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await saveSpaceNoteAction(coreSlug, itemSlug, notes);
          })
        }
      >
        <Save className="w-4 h-4 mr-2" />
        {isPending ? "Saving..." : "Save notes"}
      </Button>
    </div>
  );
}