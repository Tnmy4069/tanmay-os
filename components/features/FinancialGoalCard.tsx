"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteGoal, contributeToGoal } from "@/app/actions/finance.actions";
import type { ClientGoal } from "@/app/actions/finance.actions";
import { formatCurrency } from "@/lib/finance-constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
  goal: ClientGoal;
  onEdit?: (goal: ClientGoal) => void;
};

function ContributeModal({
  goal,
  isOpen,
  onOpenChange,
}: {
  goal: ClientGoal;
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) { setError("Enter a valid amount."); return; }
    startTransition(async () => {
      const r = await contributeToGoal(goal._id, n);
      if (!r.success) { setError((r as any).message ?? "Error"); return; }
      setAmount(""); setError(""); onOpenChange(false);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Contribute to &quot;{goal.title}&quot;</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="stat-label mb-1.5 block">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground">₹</span>
              <input
                className="field pl-8 text-lg font-black"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Remaining: {formatCurrency(goal.targetAmount - goal.currentAmount)}
          </p>
          {error && <p className="text-sm text-destructive font-semibold">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 btn-depth" disabled={isPending}>
              {isPending ? "Saving…" : "Contribute"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function FinancialGoalCard({ goal, onEdit }: Props) {
  const [contributeOpen, setContributeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const pct = goal.progressPercent;
  const isAchieved = goal.status === "achieved";
  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
    : null;

  function handleDelete() {
    if (!confirm(`Delete goal "${goal.title}"? This cannot be undone.`)) return;
    startTransition(async () => { await deleteGoal(goal._id); });
  }

  return (
    <>
      <div
        className={cn(
          "surface relative overflow-hidden p-4 sm:p-5 transition-all",
          isAchieved && "ring-2 ring-[color:var(--success)]"
        )}
      >
        {/* Ambient background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(300px 200px at 100% 0%, ${goal.color}, transparent)`,
          }}
        />

        <div className="relative space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-xl"
                style={{ backgroundColor: `${goal.color}25` }}
              >
                {goal.icon}
              </span>
              <div className="min-w-0">
                <p className="truncate font-extrabold leading-tight">{goal.title}</p>
                {isAchieved && (
                  <span className="text-[11px] font-extrabold text-[color:var(--success)] uppercase tracking-wide">
                    ✓ Achieved!
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              {onEdit && !isAchieved && (
                <button
                  type="button"
                  onClick={() => onEdit(goal)}
                  className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-end justify-between mb-1.5">
              <span className="text-2xl font-black tabular-nums" style={{ color: goal.color }}>
                {pct}%
              </span>
              <div className="text-right">
                <p className="text-xs font-bold text-muted-foreground">
                  {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                </p>
                {daysLeft !== null && daysLeft > 0 && (
                  <p className="text-[10px] text-muted-foreground/70">{daysLeft}d left</p>
                )}
                {daysLeft !== null && daysLeft <= 0 && !isAchieved && (
                  <p className="text-[10px] text-destructive font-bold">Overdue!</p>
                )}
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-secondary border-2 border-border">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, pct)}%`, backgroundColor: goal.color }}
              />
            </div>
          </div>

          {/* Description */}
          {goal.description && (
            <p className="text-xs text-muted-foreground">{goal.description}</p>
          )}

          {/* Contribute button */}
          {!isAchieved && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full btn-depth text-xs font-extrabold"
              onClick={() => setContributeOpen(true)}
            >
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
              Contribute
            </Button>
          )}
        </div>
      </div>

      <ContributeModal goal={goal} isOpen={contributeOpen} onOpenChange={setContributeOpen} />
    </>
  );
}
