"use client";

import { useState, useTransition, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Plus, TrendingUp, TrendingDown, Minus, ArrowRight, RefreshCw, Wallet } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MonthlySummary, ClientTransaction, ClientCategory, ClientGoal, ClientRecurringTemplate } from "@/app/actions/finance.actions";
import type { SpendingInsight } from "@/lib/finance-constants";
import { formatCurrency, monthKey } from "@/lib/finance-constants";
import { TransactionModal } from "./TransactionModal";
import { TransactionList } from "./TransactionList";
import { FinanceInsights } from "./FinanceInsights";
import { FinancialGoalCard } from "./FinancialGoalCard";
import { generateDueRecurring } from "@/app/actions/finance.actions";
import { useRegisterMobileFab } from "@/lib/mobile-fab-context";
import { Button } from "@/components/ui/button";

type Props = {
  summary: MonthlySummary;
  recentTransactions: ClientTransaction[];
  categories: ClientCategory[];
  goals: ClientGoal[];
  recurringTemplates: ClientRecurringTemplate[];
  insights: SpendingInsight[];
};

function StatCard({
  label,
  value,
  paise,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  paise: number;
  tone: "income" | "expense" | "net" | "rate";
  icon: typeof TrendingUp;
}) {
  const styles = {
    income: {
      bg: "bg-[color:var(--success)]/12",
      icon: "bg-[color:var(--success)] text-[color:var(--success-foreground)]",
      value: "text-[color:var(--success)]",
    },
    expense: {
      bg: "bg-destructive/10",
      icon: "bg-destructive text-destructive-foreground",
      value: "text-destructive",
    },
    net: {
      bg: paise >= 0 ? "bg-primary/12" : "bg-destructive/10",
      icon: paise >= 0 ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground",
      value: paise >= 0 ? "text-primary dark:text-primary" : "text-destructive",
    },
    rate: {
      bg: "bg-[color:var(--info)]/10",
      icon: "bg-[color:var(--info)] text-[color:var(--info-foreground)]",
      value: "text-foreground",
    },
  }[tone];

  return (
    <div className={cn("rounded-3xl p-4", styles.bg)}>
      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-2xl mb-3", styles.icon)}>
        <Icon className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <p className="stat-label mb-1">{label}</p>
      <p className={cn("text-xl font-black tabular-nums leading-tight sm:text-2xl", styles.value)}>{value}</p>
    </div>
  );
}

const RADIAN = Math.PI / 180;
function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: any) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>
      {Math.round(percent * 100)}%
    </text>
  );
}

function SpendingPie({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (data.length === 0) return (
    <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
      No expense data
    </div>
  );

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            labelLine={false}
            label={CustomPieLabel}
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => formatCurrency(v as number)}
            contentStyle={{
              borderRadius: 12,
              border: "2px solid var(--border)",
              background: "var(--card)",
              fontSize: 12,
              fontWeight: 700,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 sm:flex-col sm:gap-y-1.5 max-h-48 overflow-y-auto">
        {data.slice(0, 8).map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 min-w-0">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="truncate text-[11px] font-semibold text-muted-foreground max-w-[100px]">
              {d.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyChart({ data }: { data: { date: string; income: number; expense: number }[] }) {
  if (data.length === 0) return null;
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={formatted} barSize={8} barGap={2}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fontWeight: 700, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          interval="equidistantPreserveStart"
        />
        <YAxis hide />
        <Tooltip
          formatter={(v, name) => [formatCurrency(v as number), (name as string) === "income" ? "Income" : "Expense"]}
          contentStyle={{ borderRadius: 12, border: "2px solid var(--border)", background: "var(--card)", fontSize: 12, fontWeight: 700 }}
        />
        <Bar dataKey="expense" fill="var(--destructive)" opacity={0.7} radius={[4, 4, 0, 0]} />
        <Bar dataKey="income" fill="var(--success)" opacity={0.85} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FinanceDashboard({
  summary,
  recentTransactions,
  categories,
  goals,
  recurringTemplates,
  insights,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<"income" | "expense">("expense");
  const [isGenerating, startGenerate] = useTransition();

  const openAdd = useCallback((type: "income" | "expense") => {
    setAddType(type);
    setAddOpen(true);
  }, []);

  useRegisterMobileFab({
    label: "Add Transaction",
    onAction: () => openAdd("expense"),
  });

  const expenseBreakdown = summary.categoryBreakdown
    .filter((c) => c.type === "expense")
    .map((c) => ({ name: c.categoryName, value: c.total, color: c.color }));

  const netIsPositive = summary.netFlow >= 0;

  // Upcoming recurring (next 7 days)
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86400000);
  const upcoming = recurringTemplates.filter((t) => {
    const due = new Date(t.nextDue);
    return t.isActive && due >= now && due <= in7;
  });

  function handleGenerate() {
    startGenerate(async () => { await generateDueRecurring(); });
  }

  return (
    <>
      <div className="app-page max-w-7xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="type-caption">Finance · {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}</p>
            <h1 className="type-h1">Money</h1>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Track it. Budget it. Grow it.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => openAdd("income")}
              className="hidden sm:flex items-center gap-1.5 rounded-2xl border-2 border-[color:var(--success)]/40 bg-[color:var(--success)]/10 px-3 py-2 text-sm font-extrabold text-[color:var(--success)] hover:bg-[color:var(--success)]/20 transition-colors"
            >
              + Income
            </button>
            <button
              type="button"
              onClick={() => openAdd("expense")}
              className="flex items-center gap-1.5 rounded-2xl bg-primary px-3 py-2 text-sm font-extrabold text-primary-foreground btn-depth"
            >
              + Expense
            </button>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && <FinanceInsights insights={insights} />}

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          <StatCard label="Income" value={formatCurrency(summary.totalIncome, { compact: true })} paise={summary.totalIncome} tone="income" icon={TrendingUp} />
          <StatCard label="Expenses" value={formatCurrency(summary.totalExpense, { compact: true })} paise={summary.totalExpense} tone="expense" icon={TrendingDown} />
          <StatCard
            label="Net Flow"
            value={`${netIsPositive ? "+" : ""}${formatCurrency(summary.netFlow, { compact: true })}`}
            paise={summary.netFlow}
            tone="net"
            icon={netIsPositive ? TrendingUp : TrendingDown}
          />
          <StatCard
            label="Savings Rate"
            value={`${summary.savingsRate}%`}
            paise={summary.savingsRate}
            tone="rate"
            icon={Wallet}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Left column — charts + recent */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Spending by category */}
            {expenseBreakdown.length > 0 && (
              <div className="surface p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="type-h3">Spending Breakdown</h2>
                  <Link href="/finance/transactions" className="text-sm font-extrabold text-primary hover:underline flex items-center gap-1">
                    All <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <SpendingPie data={expenseBreakdown} />
              </div>
            )}

            {/* Daily flow chart */}
            {summary.dailyFlow.length > 0 && (
              <div className="surface p-4 sm:p-5">
                <h2 className="type-h3 mb-4">Daily Activity</h2>
                <DailyChart data={summary.dailyFlow} />
              </div>
            )}

            {/* Recent transactions */}
            <div className="surface p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="type-h3">Recent Transactions</h2>
                <Link href="/finance/transactions" className="text-sm font-extrabold text-primary hover:underline flex items-center gap-1">
                  All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <TransactionList
                transactions={recentTransactions}
                categories={categories}
                goals={goals.map((g) => ({ _id: g._id, title: g.title }))}
                showDate={false}
              />
            </div>
          </div>

          {/* Right column — goals + upcoming */}
          <div className="space-y-4 sm:space-y-6">
            {/* Goals */}
            {goals.filter((g) => g.status === "active").length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="type-h3">Goals</h2>
                  <Link href="/finance/goals" className="text-sm font-extrabold text-primary hover:underline flex items-center gap-1">
                    All <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {goals.filter((g) => g.status === "active").slice(0, 3).map((g) => (
                    <FinancialGoalCard key={g._id} goal={g} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming recurring */}
            {upcoming.length > 0 && (
              <div className="surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="type-h3 text-base">Upcoming (7d)</h2>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="text-muted-foreground hover:text-primary rounded-lg p-1 transition-colors"
                    title="Generate due recurring"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", isGenerating && "animate-spin")} />
                  </button>
                </div>
                <ul className="space-y-2">
                  {upcoming.map((t) => {
                    const cat = categories.find((c) => c._id === t.categoryId);
                    return (
                      <li key={t._id} className="flex items-center gap-3">
                        <span className="text-sm">{cat?.icon ?? (t.type === "income" ? "💰" : "💸")}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{t.description}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{t.frequency}</p>
                        </div>
                        <span className={cn(
                          "shrink-0 text-sm font-extrabold tabular-nums",
                          t.type === "income" ? "text-[color:var(--success)]" : "text-muted-foreground"
                        )}>
                          {t.type === "expense" ? "−" : "+"}{formatCurrency(t.amount)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Quick links */}
            <div className="surface p-4">
              <h2 className="type-h3 text-base mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href="/finance/budgets"
                  className="flex items-center gap-2 rounded-2xl p-2.5 text-sm font-extrabold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  🎯 Manage Budgets
                  <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-50" />
                </Link>
                <Link
                  href="/finance/goals"
                  className="flex items-center gap-2 rounded-2xl p-2.5 text-sm font-extrabold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  🐷 Savings Goals
                  <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-50" />
                </Link>
                <Link
                  href="/finance/transactions"
                  className="flex items-center gap-2 rounded-2xl p-2.5 text-sm font-extrabold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  📋 All Transactions
                  <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-50" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TransactionModal
        isOpen={addOpen}
        onOpenChange={setAddOpen}
        categories={categories}
        goals={goals.filter((g) => g.status === "active")}
        defaultType={addType}
      />
    </>
  );
}
