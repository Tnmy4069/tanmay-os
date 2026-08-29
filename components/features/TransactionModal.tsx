"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "@/app/actions/finance.actions";
import type { ClientTransaction, ClientCategory } from "@/app/actions/finance.actions";
import { paiseToRupeesStr, PAYMENT_METHODS } from "@/lib/finance-constants";

type Props = {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  categories: ClientCategory[];
  goals?: { _id: string; title: string }[];
  editTransaction?: ClientTransaction | null;
  defaultType?: "income" | "expense";
  onSuccess?: () => void;
};

export function TransactionModal({
  isOpen,
  onOpenChange,
  categories,
  goals = [],
  editTransaction,
  defaultType = "expense",
  onSuccess,
}: Props) {
  const isEdit = !!editTransaction;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<"income" | "expense">(
    isEdit ? editTransaction!.type : defaultType
  );
  const [amount, setAmount] = useState(
    isEdit ? paiseToRupeesStr(editTransaction!.amount) : ""
  );
  const [description, setDescription] = useState(isEdit ? editTransaction!.description : "");
  const [categoryId, setCategoryId] = useState(isEdit ? editTransaction!.categoryId : "");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>(
    isEdit ? (editTransaction!.paymentMethod as any) : "UPI"
  );
  const [date, setDate] = useState(
    isEdit
      ? new Date(editTransaction!.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(isEdit ? editTransaction!.notes : "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(isEdit ? editTransaction!.tags : []);
  const [relatedGoalId, setRelatedGoalId] = useState(isEdit ? editTransaction!.relatedGoalId ?? "" : "");

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === "both"
  );
  const selectedCategory = categories.find((c) => c._id === categoryId);

  function reset() {
    setType(defaultType);
    setAmount("");
    setDescription("");
    setCategoryId("");
    setPaymentMethod("UPI");
    setDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setTags([]);
    setTagInput("");
    setRelatedGoalId("");
    setError(null);
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (!tags.includes(tag)) setTags([...tags, tag]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!description.trim()) {
      setError("Please add a description.");
      return;
    }

    startTransition(async () => {
      let result;
      if (isEdit) {
        result = await updateTransaction(editTransaction!._id, {
          type,
          amountRupees: amountNum,
          date,
          description: description.trim(),
          categoryId,
          categoryName: selectedCategory?.name ?? "",
          paymentMethod,
          tags,
          notes: notes.trim(),
        });
      } else {
        result = await createTransaction({
          type,
          amountRupees: amountNum,
          date,
          description: description.trim(),
          categoryId,
          categoryName: selectedCategory?.name ?? "",
          paymentMethod,
          tags,
          notes: notes.trim(),
          relatedGoalId: relatedGoalId || undefined,
        });
      }

      if (result && !result.success) {
        setError((result as any).message ?? "Something went wrong.");
        return;
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="type-h3">
            {isEdit ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Type toggle */}
          <div className="flex gap-2 rounded-2xl bg-secondary p-1">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategoryId(""); }}
                className={cn(
                  "flex-1 rounded-xl py-2 text-sm font-extrabold capitalize transition-all duration-200",
                  type === t
                    ? t === "expense"
                      ? "bg-destructive text-destructive-foreground shadow-sm"
                      : "bg-[color:var(--success)] text-[color:var(--success-foreground)] shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "expense" ? "💸 Expense" : "💰 Income"}
              </button>
            ))}
          </div>

          {/* Amount */}
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
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="stat-label mb-1.5 block">Description</label>
            <input
              className="field"
              type="text"
              placeholder={type === "expense" ? "e.g. Zomato order, Metro ticket" : "e.g. Salary, Freelance project"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Category + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="stat-label mb-1.5 block">Category</label>
              <select
                className="field"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">— None —</option>
                {filteredCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="stat-label mb-1.5 block">Date</label>
              <input
                className="field"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="stat-label mb-1.5 block">Payment Method</label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={cn(
                    "chip text-xs",
                    paymentMethod === m && "chip-active"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Goal link (income only) */}
          {type === "income" && goals.length > 0 && (
            <div>
              <label className="stat-label mb-1.5 block">Link to Goal (optional)</label>
              <select
                className="field"
                value={relatedGoalId}
                onChange={(e) => setRelatedGoalId(e.target.value)}
              >
                <option value="">— No goal —</option>
                {goals.map((g) => (
                  <option key={g._id} value={g._id}>{g.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="stat-label mb-1.5 block">Tags</label>
            <input
              className="field"
              type="text"
              placeholder="Type and press Enter or comma"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
            />
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="chip chip-active text-xs"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="stat-label mb-1.5 block">Notes (optional)</label>
            <textarea
              className="field min-h-[4rem] py-2.5 resize-none"
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { reset(); onOpenChange(false); }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 btn-depth" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : type === "expense" ? "Add Expense" : "Add Income"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
