"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { upsertBudget, deleteBudget } from "@/app/actions/finance.actions";
import type { ClientBudget, ClientCategory } from "@/app/actions/finance.actions";
import { formatCurrency, monthKey } from "@/lib/finance-constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type CategorySpend = {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  total: number; // paise actual spend
};

type Props = {
  budgets: ClientBudget[];
  categorySpends: CategorySpend[];
  categories: ClientCategory[];
  month?: string;
};

function BudgetFormModal({
  isOpen,
  onOpenChange,
  categories,
  editBudget,
  month,
}: {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  categories: ClientCategory[];
  editBudget?: ClientBudget | null;
  month: string;
}) {
  const [categoryId, setCategoryId] = useState(editBudget?.categoryId ?? "");
  const [amount, setAmount] = useState(editBudget ? String(editBudget.amount / 100) : "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");
  const selectedCat = categories.find((c) => c._id === categoryId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) { setError("Select a category."); return; }
    const n = parseFloat(amount);
    if (!n || n <= 0) { setError("Enter a valid budget amount."); return; }
    startTransition(async () => {
      const r = await upsertBudget({
        categoryId,
        categoryName: selectedCat?.name ?? "",
        amountRupees: n,
        month,
      });
      if (!r.success) { setError((r as any).message ?? "Error"); return; }
      setError(""); onOpenChange(false);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editBudget ? "Edit Budget" : "Set Budget"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="stat-label mb-1.5 block">Category</label>
            <select
              className="field"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!editBudget}
            >
              <option value="">— Select category —</option>
              {expenseCategories.map((c) => (
                <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="stat-label mb-1.5 block">Monthly Budget (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground">₹</span>
              <input
                className="field pl-8 text-lg font-black"
                type="number"
                step="1"
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive font-semibold">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 btn-depth" disabled={isPending}>
              {isPending ? "Saving…" : editBudget ? "Save" : "Set Budget"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BudgetCard({
  budget,
  spend,
  categories,
  month,
}: {
  budget: ClientBudget;
  spend?: CategorySpend;
  categories: ClientCategory[];
  month: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const cat = categories.find((c) => c._id === budget.categoryId);
  const actual = spend?.total ?? 0;
  const pct = budget.amount > 0 ? Math.round((actual / budget.amount) * 100) : 0;
  const isOver = actual > budget.amount;
  const isWarn = !isOver && pct >= 80;

  function handleDelete() {
    if (!confirm(`Remove budget for "${budget.categoryName}"?`)) return;
    startTransition(async () => { await deleteBudget(budget._id); });
  }

  return (
    <>
      <div className={cn(
        "surface p-4",
        isOver && "border-destructive/40",
      )}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-base"
              style={{ backgroundColor: `${cat?.color ?? "#94a3b8"}20` }}
            >
              {cat?.icon ?? "💸"}
            </span>
            <div>
              <p className="text-sm font-extrabold leading-tight">{budget.categoryName}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(actual)} / {formatCurrency(budget.amount)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isOver && <AlertTriangle className="h-4 w-4 text-destructive" />}
            <span
              className={cn(
                "text-lg font-black tabular-nums",
                isOver ? "text-destructive" : isWarn ? "text-[color:var(--warning-foreground)] dark:text-[color:var(--warning)]" : "text-foreground"
              )}
            >
              {pct}%
            </span>
          </div>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-secondary border border-border">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isOver ? "bg-destructive" : isWarn ? "bg-[color:var(--warning)]" : "bg-primary"
            )}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <p className={cn(
            "text-[11px] font-bold",
            isOver ? "text-destructive" : "text-muted-foreground"
          )}>
            {isOver
              ? `${formatCurrency(actual - budget.amount)} over budget`
              : `${formatCurrency(budget.amount - actual)} remaining`}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <BudgetFormModal
        isOpen={editOpen}
        onOpenChange={setEditOpen}
        categories={categories}
        editBudget={budget}
        month={month}
      />
    </>
  );
}

export function BudgetManager({ budgets, categorySpends, categories, month }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const m = month ?? monthKey();
  const spendMap = new Map(categorySpends.map((s) => [s.categoryId, s]));

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spendMap.get(b.categoryId)?.total ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {budgets.length > 0 && (
        <div className="surface p-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="stat-label">Total budgeted</p>
              <p className="text-2xl font-black">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="text-right">
              <p className="stat-label">Spent</p>
              <p className={cn(
                "text-xl font-black",
                totalSpent > totalBudget ? "text-destructive" : "text-foreground"
              )}>
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-secondary border-2 border-border">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                totalSpent > totalBudget ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${Math.min(100, totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0)}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border px-6 py-10 text-center">
          <p className="text-4xl mb-3">🐱</p>
          <p className="text-sm font-bold text-muted-foreground">No budgets set for this month.</p>
          <p className="text-xs text-muted-foreground mt-1">Set category budgets to track your spending.</p>
          <Button className="mt-4 btn-depth" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Set a Budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {budgets.map((b) => (
            <BudgetCard
              key={b._id}
              budget={b}
              spend={spendMap.get(b.categoryId)}
              categories={categories}
              month={m}
            />
          ))}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex min-h-[100px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-extrabold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Budget
          </button>
        </div>
      )}

      <BudgetFormModal
        isOpen={addOpen}
        onOpenChange={setAddOpen}
        categories={categories}
        month={m}
      />
    </div>
  );
}
