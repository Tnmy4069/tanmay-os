import { auth } from "@/lib/auth";
import {
  getMonthlySummary,
  getBudgets,
  getOrSeedCategories,
} from "@/app/actions/finance.actions";
import { BudgetManager } from "@/components/features/BudgetManager";
import { monthKey } from "@/lib/finance-constants";

export const metadata = {
  title: "Budgets — Finance — Tanmay OS",
};

export default async function BudgetsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const m = monthKey();
  const [budgets, summary, categories] = await Promise.all([
    getBudgets(m),
    getMonthlySummary(m),
    getOrSeedCategories(),
  ]);

  // Build category spend from summary breakdown
  const categorySpends = summary.categoryBreakdown
    .filter((c) => c.type === "expense")
    .map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      icon: c.icon,
      color: c.color,
      total: c.total,
    }));

  return (
    <div className="app-page max-w-3xl">
      <div className="mb-2">
        <p className="type-caption">Finance</p>
        <h1 className="type-h1">Budgets</h1>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}
        </p>
      </div>

      <BudgetManager
        budgets={budgets}
        categorySpends={categorySpends}
        categories={categories}
        month={m}
      />
    </div>
  );
}
