"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteTransaction } from "@/app/actions/finance.actions";
import type { ClientTransaction, ClientCategory } from "@/app/actions/finance.actions";
import { formatCurrency } from "@/lib/finance-constants";
import { TransactionModal } from "./TransactionModal";

type Props = {
  transactions: ClientTransaction[];
  categories: ClientCategory[];
  goals?: { _id: string; title: string }[];
  showDate?: boolean;
};

function groupByDate(transactions: ClientTransaction[]) {
  const groups = new Map<string, ClientTransaction[]>();
  for (const t of transactions) {
    const day = new Date(t.date).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(t);
  }
  return groups;
}

function TransactionRow({
  tx,
  categories,
  goals,
}: {
  tx: ClientTransaction;
  categories: ClientCategory[];
  goals: { _id: string; title: string }[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isIncome = tx.type === "income";
  const cat = categories.find((c) => c._id === tx.categoryId);

  function handleDelete() {
    if (!confirm(`Delete "${tx.description}"?`)) return;
    startTransition(async () => { await deleteTransaction(tx._id); });
  }

  return (
    <>
      <li className="group flex items-center gap-3 rounded-2xl px-1 py-2.5 transition-colors hover:bg-secondary/60">
        {/* Category icon */}
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg"
          style={{ backgroundColor: `${cat?.color ?? "#94a3b8"}20` }}
        >
          {cat?.icon ?? (isIncome ? "💰" : "💸")}
        </span>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold leading-tight">{tx.description}</p>
          <p className="mt-0.5 text-[11px] font-bold text-muted-foreground truncate">
            {cat?.name ?? "Uncategorised"} · {tx.paymentMethod}
            {tx.tags.length > 0 && ` · ${tx.tags.slice(0, 2).join(", ")}`}
          </p>
        </div>

        {/* Amount */}
        <p
          className={cn(
            "shrink-0 tabular-nums text-base font-black",
            isIncome ? "text-[color:var(--success)]" : "text-foreground"
          )}
        >
          {isIncome ? "+" : "−"}{formatCurrency(tx.amount)}
        </p>

        {/* Actions (visible on hover / focus) */}
        <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </li>

      <TransactionModal
        isOpen={editOpen}
        onOpenChange={setEditOpen}
        categories={categories}
        goals={goals}
        editTransaction={tx}
      />
    </>
  );
}

export function TransactionList({ transactions, categories, goals = [], showDate = true }: Props) {
  const [expanded, setExpanded] = useState(true);

  if (transactions.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-border px-6 py-10 text-center">
        <p className="text-4xl mb-3">🐱</p>
        <p className="text-sm font-bold text-muted-foreground">No transactions yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Add your first income or expense to get started.</p>
      </div>
    );
  }

  if (!showDate) {
    return (
      <ul className="space-y-1">
        {transactions.map((tx) => (
          <TransactionRow key={tx._id} tx={tx} categories={categories} goals={goals} />
        ))}
      </ul>
    );
  }

  const groups = groupByDate(transactions);

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([day, txns]) => {
        const dayIncome = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const dayExpense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

        return (
          <div key={day}>
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="flex w-full items-center justify-between mb-2"
            >
              <span className="stat-label">{day}</span>
              <span className="flex items-center gap-3">
                {dayIncome > 0 && (
                  <span className="text-[11px] font-extrabold text-[color:var(--success)]">
                    +{formatCurrency(dayIncome)}
                  </span>
                )}
                {dayExpense > 0 && (
                  <span className="text-[11px] font-extrabold text-muted-foreground">
                    −{formatCurrency(dayExpense)}
                  </span>
                )}
              </span>
            </button>
            <ul className="space-y-1">
              {txns.map((tx) => (
                <TransactionRow key={tx._id} tx={tx} categories={categories} goals={goals} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
