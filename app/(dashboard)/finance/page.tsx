import { auth } from "@/lib/auth";
import {
  getMonthlySummary,
  getTransactions,
  getOrSeedCategories,
  getFinancialGoals,
  getRecurringTemplates,
  getFinancialInsights,
  generateDueRecurring,
} from "@/app/actions/finance.actions";
import { FinanceDashboard } from "@/components/features/FinanceDashboard";
import { monthKey } from "@/lib/finance-constants";

export const metadata = {
  title: "Finance — Tanmay OS",
  description: "Track income, expenses, budgets, and financial goals.",
};

export default async function FinancePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Auto-generate any due recurring transactions on page load
  await generateDueRecurring().catch(() => {});

  const [summary, { transactions: recent }, categories, goals, templates, insights] =
    await Promise.all([
      getMonthlySummary(monthKey()),
      getTransactions({ limit: 8 }),
      getOrSeedCategories(),
      getFinancialGoals(),
      getRecurringTemplates(),
      getFinancialInsights().catch(() => []),
    ]);

  return (
    <FinanceDashboard
      summary={summary}
      recentTransactions={recent}
      categories={categories}
      goals={goals}
      recurringTemplates={templates}
      insights={insights}
    />
  );
}
