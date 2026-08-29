"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTransactions,
  getOrSeedCategories,
  getFinancialGoals,
} from "@/app/actions/finance.actions";
import type { ClientTransaction, ClientCategory } from "@/app/actions/finance.actions";
import { monthKey, formatCurrency } from "@/lib/finance-constants";
import { TransactionModal } from "@/components/features/TransactionModal";
import { TransactionList } from "@/components/features/TransactionList";
import { useRegisterMobileFab } from "@/lib/mobile-fab-context";

type Filter = {
  type: "all" | "income" | "expense";
  month: string;
  search: string;
};

export default function TransactionsPage() {
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [goals, setGoals] = useState<{ _id: string; title: string }[]>([]);
  const [transactions, setTransactions] = useState<ClientTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState<Filter>({
    type: "all",
    month: monthKey(),
    search: "",
  });

  useRegisterMobileFab({
    label: "Add Transaction",
    onAction: () => setAddOpen(true),
  });

  async function load(f: Filter) {
    setIsLoading(true);
    try {
      const [cats, { transactions: txns, total: t }, gs] = await Promise.all([
        getOrSeedCategories(),
        getTransactions({
          type: f.type !== "all" ? f.type : undefined,
          month: f.month,
          limit: 100,
        }),
        getFinancialGoals(),
      ]);
      setCategories(cats);
      // Client-side search filter
      const filtered = f.search
        ? txns.filter(
            (t) =>
              t.description.toLowerCase().includes(f.search.toLowerCase()) ||
              t.categoryName.toLowerCase().includes(f.search.toLowerCase()) ||
              t.tags.some((tag) => tag.includes(f.search.toLowerCase()))
          )
        : txns;
      setTransactions(filtered);
      setTotal(t);
      setGoals(gs.filter((g) => g.status === "active").map((g) => ({ _id: g._id, title: g.title })));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load(filters);
  }, [filters]);

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <div className="app-page max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="type-caption">Finance</p>
            <h1 className="type-h1">Transactions</h1>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-primary px-3 py-2 text-sm font-extrabold text-primary-foreground btn-depth shrink-0"
          >
            <Plus className="h-4 w-4" strokeWidth={3} /> Add
          </button>
        </div>

        {/* Month / Type filters */}
        <div className="flex flex-wrap gap-2">
          <input
            type="month"
            className="field w-auto"
            value={filters.month}
            onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
          />
          {(["all", "income", "expense"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, type: t }))}
              className={cn("chip capitalize", filters.type === t && "chip-active")}
            >
              {t === "all" ? "All" : t === "income" ? "💰 Income" : "💸 Expense"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="field pl-9"
            type="text"
            placeholder="Search transactions…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>

        {/* Summary pills */}
        {transactions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--success)]/15 px-3 py-1 text-sm font-extrabold text-[color:var(--success)]">
              +{formatCurrency(income, { compact: true })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-sm font-extrabold text-destructive">
              −{formatCurrency(expense, { compact: true })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-extrabold text-muted-foreground">
              {transactions.length} entries
            </span>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            categories={categories}
            goals={goals}
          />
        )}
      </div>

      <TransactionModal
        isOpen={addOpen}
        onOpenChange={setAddOpen}
        categories={categories}
        goals={goals}
        onSuccess={() => load(filters)}
      />
    </>
  );
}
