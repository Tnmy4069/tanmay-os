// Finance module constants — default categories, helpers, and display utilities

// ─── Payment Methods (duplicated here from Transaction model to be client-safe) ─
export const PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Credit Card",
  "Debit Card",
  "Net Banking",
  "Wallet",
  "Cheque",
  "Other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type DefaultCategory = {
  id: string;
  name: string;
  icon: string; // emoji
  color: string;
  type: "income" | "expense" | "both";
  order: number;
};

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { id: "food", name: "Food & Dining", icon: "🍜", color: "#ff6b35", type: "expense", order: 0 },
  { id: "transport", name: "Transport", icon: "🚇", color: "#1cb0f6", type: "expense", order: 1 },
  { id: "education", name: "Education", icon: "📚", color: "#ce82ff", type: "expense", order: 2 },
  { id: "shopping", name: "Shopping", icon: "🛍️", color: "#ff4b4b", type: "expense", order: 3 },
  { id: "bills", name: "Bills & Utilities", icon: "⚡", color: "#ffc800", type: "expense", order: 4 },
  { id: "entertainment", name: "Entertainment", icon: "🎮", color: "#ff9600", type: "expense", order: 5 },
  { id: "fitness", name: "Fitness", icon: "💪", color: "#58cc02", type: "expense", order: 6 },
  { id: "subscriptions", name: "Subscriptions", icon: "📱", color: "#8b5cf6", type: "expense", order: 7 },
  { id: "healthcare", name: "Healthcare", icon: "🏥", color: "#14b8a6", type: "expense", order: 8 },
  { id: "personal", name: "Personal Care", icon: "✨", color: "#f472b6", type: "expense", order: 9 },
  { id: "family", name: "Family", icon: "👨‍👩‍👧", color: "#f97316", type: "expense", order: 10 },
  { id: "technology", name: "Technology", icon: "💻", color: "#6366f1", type: "expense", order: 11 },
  { id: "travel", name: "Travel", icon: "✈️", color: "#0ea5e9", type: "expense", order: 12 },
  { id: "rent", name: "Rent & Housing", icon: "🏠", color: "#84cc16", type: "expense", order: 13 },
  { id: "investments", name: "Investments", icon: "📈", color: "#10b981", type: "expense", order: 14 },
  { id: "other-expense", name: "Other", icon: "💸", color: "#94a3b8", type: "expense", order: 15 },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { id: "salary", name: "Salary", icon: "💼", color: "#58cc02", type: "income", order: 0 },
  { id: "internship", name: "Internship", icon: "🎓", color: "#1cb0f6", type: "income", order: 1 },
  { id: "freelance", name: "Freelancing", icon: "🔧", color: "#ce82ff", type: "income", order: 2 },
  { id: "business", name: "Business", icon: "🏢", color: "#ff9600", type: "income", order: 3 },
  { id: "investment-returns", name: "Investment Returns", icon: "📊", color: "#10b981", type: "income", order: 4 },
  { id: "refund", name: "Refund", icon: "🔄", color: "#14b8a6", type: "income", order: 5 },
  { id: "gift", name: "Gift / Allowance", icon: "🎁", color: "#f472b6", type: "income", order: 6 },
  { id: "other-income", name: "Other", icon: "💰", color: "#94a3b8", type: "income", order: 7 },
];

export const ALL_DEFAULT_CATEGORIES = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];

// ─── Currency helpers ─────────────────────────────────────────────────────────

/** Convert rupees (float) → paise (integer). e.g. 1250.50 → 125050 */
export function rupeesToPaise(rupees: number | string): number {
  const n = typeof rupees === "string" ? parseFloat(rupees) : rupees;
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}

/** Convert paise → rupees display string. e.g. 125050 → "₹1,250.50" */
export function formatCurrency(paise: number, options?: { compact?: boolean }): string {
  const rupees = paise / 100;
  if (options?.compact) {
    if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
    if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/** Format paise as plain number string for input fields */
export function paiseToRupeesStr(paise: number): string {
  return (paise / 100).toFixed(2);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns "YYYY-MM" for the given date (or today) in IST */
export function monthKey(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 7);
}

/** Returns first and last moment of the given YYYY-MM month in UTC */
export function monthBounds(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(`${month}-01T00:00:00+05:30`);
  const end = new Date(y, m, 1); // first moment of next month UTC
  // Use IST-aware end: last moment of month
  const endIST = new Date(`${y}-${String(m + 1 > 12 ? 1 : m + 1).padStart(2, "0")}-01T00:00:00+05:30`);
  // Handle year rollover
  if (m === 12) {
    return {
      start,
      end: new Date(`${y + 1}-01-01T00:00:00+05:30`),
    };
  }
  return { start, end: endIST };
}

/** Advance a Date by one recurring frequency period */
export function advanceByFrequency(
  date: Date,
  frequency: "daily" | "weekly" | "monthly" | "yearly"
): Date {
  const d = new Date(date);
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

// ─── Insight helpers ──────────────────────────────────────────────────────────

export type SpendingInsight = {
  type: "overspend" | "saving" | "goal" | "trend" | "info";
  message: string;
  severity: "good" | "warn" | "bad" | "neutral";
};

export function generateInsights(opts: {
  thisMonth: { totalIncome: number; totalExpense: number };
  lastMonth: { totalIncome: number; totalExpense: number };
  categoryBreakdown: { categoryName: string; total: number; budget?: number }[];
  goals: { title: string; currentAmount: number; targetAmount: number; deadline?: string }[];
}): SpendingInsight[] {
  const insights: SpendingInsight[] = [];
  const { thisMonth, lastMonth, categoryBreakdown, goals } = opts;

  // Net cash flow
  const net = thisMonth.totalIncome - thisMonth.totalExpense;
  if (thisMonth.totalIncome > 0) {
    const savingsRate = Math.round((net / thisMonth.totalIncome) * 100);
    if (savingsRate >= 30) {
      insights.push({ type: "saving", message: `Great job — you saved ${savingsRate}% of your income this month.`, severity: "good" });
    } else if (savingsRate < 0) {
      insights.push({ type: "overspend", message: `You spent ${formatCurrency(Math.abs(net))} more than you earned this month.`, severity: "bad" });
    }
  }

  // Month-over-month expense trend
  if (lastMonth.totalExpense > 0 && thisMonth.totalExpense > 0) {
    const delta = thisMonth.totalExpense - lastMonth.totalExpense;
    const pct = Math.round(Math.abs(delta) / lastMonth.totalExpense * 100);
    if (pct >= 20) {
      if (delta > 0) {
        insights.push({ type: "trend", message: `Expenses up ${pct}% vs last month (${formatCurrency(delta)} more).`, severity: "warn" });
      } else {
        insights.push({ type: "trend", message: `Expenses down ${pct}% vs last month — nice!`, severity: "good" });
      }
    }
  }

  // Over-budget categories
  for (const cat of categoryBreakdown) {
    if (cat.budget && cat.total > cat.budget) {
      const over = cat.total - cat.budget;
      insights.push({
        type: "overspend",
        message: `${cat.categoryName}: ${formatCurrency(over)} over budget.`,
        severity: "bad",
      });
    }
  }

  // Goal projections
  for (const goal of goals) {
    if (goal.targetAmount > 0 && goal.deadline) {
      const remaining = goal.targetAmount - goal.currentAmount;
      const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
      if (remaining > 0 && daysLeft > 0) {
        const needed = Math.round((remaining / daysLeft) * 30);
        insights.push({
          type: "goal",
          message: `"${goal.title}" needs ${formatCurrency(needed)}/month to hit by deadline.`,
          severity: "neutral",
        });
      }
    }
  }

  return insights.slice(0, 4);
}
