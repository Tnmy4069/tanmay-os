"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Trophy } from "lucide-react";
import {
  getFinancialGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from "@/app/actions/finance.actions";
import type { ClientGoal } from "@/app/actions/finance.actions";
import { formatCurrency } from "@/lib/finance-constants";
import { FinancialGoalCard } from "@/components/features/FinancialGoalCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRegisterMobileFab } from "@/lib/mobile-fab-context";

const GOAL_COLORS = ["#58cc02", "#1cb0f6", "#ce82ff", "#ff9600", "#ff4b4b", "#10b981", "#f472b6", "#6366f1"];
const GOAL_ICONS = ["🎯", "💻", "✈️", "🏠", "🎓", "📈", "🐷", "💍", "🎸", "🚗", "🌍", "📱"];

function GoalFormModal({
  isOpen,
  onOpenChange,
  editGoal,
  onSuccess,
}: {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  editGoal?: ClientGoal | null;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(editGoal?.title ?? "");
  const [description, setDescription] = useState(editGoal?.description ?? "");
  const [target, setTarget] = useState(editGoal ? String(editGoal.targetAmount / 100) : "");
  const [deadline, setDeadline] = useState(
    editGoal?.deadline ? new Date(editGoal.deadline).toISOString().slice(0, 10) : ""
  );
  const [icon, setIcon] = useState(editGoal?.icon ?? "🎯");
  const [color, setColor] = useState(editGoal?.color ?? "#58cc02");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Enter a goal title."); return; }
    const n = parseFloat(target);
    if (!n || n <= 0) { setError("Enter a valid target amount."); return; }

    startTransition(async () => {
      let r;
      if (editGoal) {
        r = await updateGoal(editGoal._id, {
          title: title.trim(),
          description: description.trim(),
          icon,
          color,
          targetAmountRupees: n,
          deadline: deadline || undefined,
        });
      } else {
        r = await createGoal({
          title: title.trim(),
          description: description.trim(),
          icon,
          color,
          targetAmountRupees: n,
          deadline: deadline || undefined,
        });
      }
      if (!r.success) { setError((r as any).message ?? "Error"); return; }
      setError(""); onOpenChange(false); onSuccess();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editGoal ? "Edit Goal" : "New Savings Goal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Icon picker */}
          <div>
            <label className="stat-label mb-1.5 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`text-xl h-10 w-10 rounded-xl flex items-center justify-center transition-all ${icon === ic ? "ring-2 ring-primary bg-primary/10 scale-110" : "bg-secondary hover:bg-primary/10"}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="stat-label mb-1.5 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="stat-label mb-1.5 block">Goal Name</label>
            <input className="field" type="text" placeholder="e.g. Emergency Fund, MacBook Pro" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="stat-label mb-1.5 block">Target Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground">₹</span>
              <input className="field pl-8 text-lg font-black" type="number" step="1" min="1" placeholder="0" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="stat-label mb-1.5 block">Deadline (optional)</label>
            <input className="field" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <div>
            <label className="stat-label mb-1.5 block">Description (optional)</label>
            <textarea className="field min-h-[3rem] py-2.5 resize-none" placeholder="Why this goal matters…" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive font-semibold">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1 btn-depth" disabled={isPending}>
              {isPending ? "Saving…" : editGoal ? "Save" : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<ClientGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<ClientGoal | null>(null);

  useRegisterMobileFab({
    label: "Add Goal",
    onAction: () => setAddOpen(true),
  });

  async function refresh() {
    setIsLoading(true);
    const gs = await getFinancialGoals();
    setGoals(gs);
    setIsLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  const active = goals.filter((g) => g.status === "active");
  const achieved = goals.filter((g) => g.status === "achieved");
  const paused = goals.filter((g) => g.status === "paused");
  const totalTarget = active.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = active.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <>
      <div className="app-page max-w-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="type-caption">Finance</p>
            <h1 className="type-h1">Goals</h1>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              Your financial targets
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="btn-depth shrink-0">
            <Plus className="mr-1.5 h-4 w-4" /> New Goal
          </Button>
        </div>

        {/* Summary */}
        {active.length > 0 && (
          <div className="surface p-4 sm:p-5">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="stat-label">Total saved</p>
                <p className="text-2xl font-black">{formatCurrency(totalSaved)}</p>
              </div>
              <p className="text-sm font-bold text-muted-foreground">of {formatCurrency(totalTarget)}</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-secondary border-2 border-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${Math.min(100, totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0)}%` }}
              />
            </div>
          </div>
        )}

        {/* Active goals */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-44 rounded-3xl bg-secondary animate-pulse" />)}
          </div>
        ) : active.length === 0 && achieved.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border px-6 py-12 text-center">
            <p className="text-5xl mb-3">🐷</p>
            <p className="text-base font-extrabold">No goals yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Set a savings target and start contributing.</p>
            <Button onClick={() => setAddOpen(true)} className="btn-depth">
              <Plus className="mr-1.5 h-4 w-4" /> Create First Goal
            </Button>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {active.map((g) => (
                  <FinancialGoalCard key={g._id} goal={g} onEdit={(goal) => { setEditGoal(goal); setAddOpen(true); }} />
                ))}
              </div>
            )}

            {achieved.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-[color:var(--warning)]" />
                  <h2 className="type-h3 text-base">Achieved</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {achieved.map((g) => <FinancialGoalCard key={g._id} goal={g} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <GoalFormModal
        isOpen={addOpen}
        onOpenChange={(v) => { if (!v) setEditGoal(null); setAddOpen(v); }}
        editGoal={editGoal}
        onSuccess={refresh}
      />
    </>
  );
}
