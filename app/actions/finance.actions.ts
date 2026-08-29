"use server";

import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Transaction from "@/models/Transaction";
import FinancialCategory from "@/models/FinancialCategory";
import Budget from "@/models/Budget";
import FinancialGoal from "@/models/FinancialGoal";
import RecurringTemplate from "@/models/RecurringTemplate";
import {
  ALL_DEFAULT_CATEGORIES,
  monthKey,
  monthBounds,
  advanceByFrequency,
  generateInsights,
  rupeesToPaise,
  formatCurrency,
} from "@/lib/finance-constants";
import { revalidatePath } from "next/cache";
import type { PaymentMethod, TransactionType } from "@/models/Transaction";
import type { RecurringFrequency } from "@/models/RecurringTemplate";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

function revalidateFinance() {
  revalidatePath("/finance");
  revalidatePath("/finance/transactions");
  revalidatePath("/finance/budgets");
  revalidatePath("/finance/goals");
  revalidatePath("/dashboard");
}

// ─── Category types ───────────────────────────────────────────────────────────

export type ClientCategory = {
  _id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
  isDefault: boolean;
  order: number;
};

function serializeCategory(cat: any): ClientCategory {
  return {
    _id: String(cat._id),
    name: String(cat.name),
    icon: String(cat.icon),
    color: String(cat.color),
    type: cat.type as "income" | "expense" | "both",
    isDefault: Boolean(cat.isDefault),
    order: Number(cat.order),
  };
}

// ─── Seed & get categories ────────────────────────────────────────────────────

export async function getOrSeedCategories(): Promise<ClientCategory[]> {
  const userId = await requireUser();
  await connectToDatabase();

  const existing = await FinancialCategory.find({ userId }).sort({ type: 1, order: 1 }).lean();
  if (existing.length > 0) return existing.map(serializeCategory);

  // Seed defaults on first visit
  const docs = ALL_DEFAULT_CATEGORIES.map((c) => ({
    userId,
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: c.type,
    isDefault: true,
    order: c.order,
  }));
  await FinancialCategory.insertMany(docs);

  const seeded = await FinancialCategory.find({ userId }).sort({ type: 1, order: 1 }).lean();
  return seeded.map(serializeCategory);
}

export async function createCategory(data: {
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
}) {
  const userId = await requireUser();
  await connectToDatabase();
  const count = await FinancialCategory.countDocuments({ userId });
  await FinancialCategory.create({ ...data, userId, isDefault: false, order: count });
  revalidateFinance();
  return { success: true };
}

export async function updateCategory(id: string, data: Partial<{ name: string; icon: string; color: string }>) {
  const userId = await requireUser();
  await connectToDatabase();
  await FinancialCategory.findOneAndUpdate({ _id: id, userId }, { $set: data });
  revalidateFinance();
  return { success: true };
}

export async function deleteCategory(id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await FinancialCategory.deleteOne({ _id: id, userId, isDefault: false });
  revalidateFinance();
  return { success: true };
}

// ─── Transaction types ────────────────────────────────────────────────────────

export type ClientTransaction = {
  _id: string;
  type: TransactionType;
  amount: number; // paise
  date: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subcategory: string;
  paymentMethod: PaymentMethod;
  tags: string[];
  notes: string;
  isRecurring: boolean;
  recurringTemplateId: string | null;
  relatedGoalId: string | null;
  createdAt: string;
};

function serializeTransaction(t: any): ClientTransaction {
  return {
    _id: String(t._id),
    type: t.type as TransactionType,
    amount: Number(t.amount),
    date: new Date(t.date).toISOString(),
    description: String(t.description),
    categoryId: String(t.categoryId ?? ""),
    categoryName: String(t.categoryName ?? ""),
    subcategory: String(t.subcategory ?? ""),
    paymentMethod: (t.paymentMethod ?? "UPI") as PaymentMethod,
    tags: Array.isArray(t.tags) ? t.tags.map(String) : [],
    notes: String(t.notes ?? ""),
    isRecurring: Boolean(t.isRecurring),
    recurringTemplateId: t.recurringTemplateId ? String(t.recurringTemplateId) : null,
    relatedGoalId: t.relatedGoalId ? String(t.relatedGoalId) : null,
    createdAt: new Date(t.createdAt).toISOString(),
  };
}

// ─── Transaction CRUD ─────────────────────────────────────────────────────────

export async function getTransactions(filters?: {
  type?: TransactionType;
  categoryId?: string;
  month?: string; // YYYY-MM
  limit?: number;
  skip?: number;
}): Promise<{ transactions: ClientTransaction[]; total: number }> {
  const userId = await requireUser();
  await connectToDatabase();

  const query: any = { userId };
  if (filters?.type) query.type = filters.type;
  if (filters?.categoryId) query.categoryId = filters.categoryId;
  if (filters?.month) {
    const { start, end } = monthBounds(filters.month);
    query.date = { $gte: start, $lt: end };
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(filters?.skip ?? 0)
      .limit(filters?.limit ?? 50)
      .lean(),
    Transaction.countDocuments(query),
  ]);

  return { transactions: transactions.map(serializeTransaction), total };
}

export async function createTransaction(data: {
  type: TransactionType;
  amountRupees: number; // user enters in rupees, we convert
  date: string;
  description: string;
  categoryId?: string;
  categoryName?: string;
  subcategory?: string;
  paymentMethod?: PaymentMethod;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
  relatedGoalId?: string;
}) {
  const userId = await requireUser();
  await connectToDatabase();

  const amount = rupeesToPaise(data.amountRupees);
  if (amount <= 0) return { success: false, error: "INVALID_AMOUNT", message: "Amount must be greater than 0." };

  await Transaction.create({
    userId,
    type: data.type,
    amount,
    date: new Date(data.date),
    description: data.description,
    categoryId: data.categoryId,
    categoryName: data.categoryName,
    subcategory: data.subcategory,
    paymentMethod: data.paymentMethod ?? "UPI",
    tags: data.tags ?? [],
    notes: data.notes,
    isRecurring: data.isRecurring ?? false,
    relatedGoalId: data.relatedGoalId || undefined,
  });

  // If linked to a goal, update its currentAmount
  if (data.relatedGoalId && data.type === "income") {
    await FinancialGoal.findOneAndUpdate(
      { _id: data.relatedGoalId, userId },
      { $inc: { currentAmount: amount } }
    );
    // Auto-achieve if target reached
    const goal = await FinancialGoal.findById(data.relatedGoalId);
    if (goal && goal.currentAmount >= goal.targetAmount && goal.status !== "achieved") {
      await FinancialGoal.findByIdAndUpdate(data.relatedGoalId, {
        status: "achieved",
        achievedAt: new Date(),
      });
    }
  }

  revalidateFinance();
  return { success: true };
}

export async function updateTransaction(
  id: string,
  data: Partial<{
    type: TransactionType;
    amountRupees: number;
    date: string;
    description: string;
    categoryId: string;
    categoryName: string;
    subcategory: string;
    paymentMethod: PaymentMethod;
    tags: string[];
    notes: string;
  }>
) {
  const userId = await requireUser();
  await connectToDatabase();

  const update: any = { ...data };
  if (data.amountRupees !== undefined) {
    update.amount = rupeesToPaise(data.amountRupees);
    delete update.amountRupees;
    if (update.amount <= 0) return { success: false, error: "INVALID_AMOUNT", message: "Amount must be greater than 0." };
  }
  if (data.date) update.date = new Date(data.date);

  await Transaction.findOneAndUpdate({ _id: id, userId }, { $set: update });
  revalidateFinance();
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await Transaction.deleteOne({ _id: id, userId });
  revalidateFinance();
  return { success: true };
}

// ─── Monthly summary ──────────────────────────────────────────────────────────

export type MonthlySummary = {
  month: string;
  totalIncome: number; // paise
  totalExpense: number; // paise
  netFlow: number; // paise (income - expense)
  savingsRate: number; // 0-100
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    icon: string;
    color: string;
    total: number; // paise
    type: TransactionType;
    budget?: number; // paise budget if set
    budgetPercent?: number;
  }[];
  dailyFlow: { date: string; income: number; expense: number }[];
  transactionCount: number;
};

export async function getMonthlySummary(month?: string): Promise<MonthlySummary> {
  const userId = await requireUser();
  await connectToDatabase();

  const m = month ?? monthKey();
  const { start, end } = monthBounds(m);

  // Aggregate totals and category breakdown in one pass
  const [agg, budgets, categories, dailyAgg] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId: (await import("mongoose")).Types.ObjectId.createFromHexString(userId), date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { type: "$type", categoryId: "$categoryId", categoryName: "$categoryName" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Budget.find({ userId, month: m }).lean(),
    FinancialCategory.find({ userId }).lean(),
    Transaction.aggregate([
      { $match: { userId: (await import("mongoose")).Types.ObjectId.createFromHexString(userId), date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Asia/Kolkata" } },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]),
  ]);

  const catMap = new Map(categories.map((c: any) => [String(c._id), c]));
  const budgetMap = new Map(budgets.map((b: any) => [b.categoryId, b.amount]));

  let totalIncome = 0;
  let totalExpense = 0;
  const breakdown: MonthlySummary["categoryBreakdown"] = [];

  for (const row of agg) {
    const { type, categoryId, categoryName } = row._id;
    if (type === "income") totalIncome += row.total;
    else totalExpense += row.total;

    const cat = catMap.get(categoryId) as any;
    const budget = budgetMap.get(categoryId);
    breakdown.push({
      categoryId: categoryId ?? "",
      categoryName: categoryName ?? "Other",
      icon: cat?.icon ?? "💰",
      color: cat?.color ?? "#94a3b8",
      total: row.total,
      type: type as TransactionType,
      budget,
      budgetPercent: budget ? Math.round((row.total / budget) * 100) : undefined,
    });
  }

  // Build daily flow map
  const dailyMap = new Map<string, { income: number; expense: number }>();
  for (const row of dailyAgg) {
    const date = row._id.date;
    if (!dailyMap.has(date)) dailyMap.set(date, { income: 0, expense: 0 });
    const entry = dailyMap.get(date)!;
    if (row._id.type === "income") entry.income += row.total;
    else entry.expense += row.total;
  }

  const netFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netFlow / totalIncome) * 100) : 0;

  return {
    month: m,
    totalIncome,
    totalExpense,
    netFlow,
    savingsRate,
    categoryBreakdown: breakdown.sort((a, b) => b.total - a.total),
    dailyFlow: Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v })),
    transactionCount: agg.reduce((acc, r) => acc + r.count, 0),
  };
}

// ─── Budget CRUD ──────────────────────────────────────────────────────────────

export type ClientBudget = {
  _id: string;
  categoryId: string;
  categoryName: string;
  amount: number; // paise
  month: string;
};

export async function getBudgets(month?: string): Promise<ClientBudget[]> {
  const userId = await requireUser();
  await connectToDatabase();
  const m = month ?? monthKey();
  const budgets = await Budget.find({ userId, month: m }).lean();
  return budgets.map((b: any) => ({
    _id: String(b._id),
    categoryId: String(b.categoryId),
    categoryName: String(b.categoryName),
    amount: Number(b.amount),
    month: String(b.month),
  }));
}

export async function upsertBudget(data: {
  categoryId: string;
  categoryName: string;
  amountRupees: number;
  month?: string;
}) {
  const userId = await requireUser();
  await connectToDatabase();

  const amount = rupeesToPaise(data.amountRupees);
  if (amount <= 0) return { success: false, error: "INVALID_AMOUNT", message: "Budget must be greater than 0." };

  const month = data.month ?? monthKey();
  await Budget.findOneAndUpdate(
    { userId, categoryId: data.categoryId, month },
    { $set: { categoryName: data.categoryName, amount, period: "monthly" } },
    { upsert: true }
  );
  revalidateFinance();
  return { success: true };
}

export async function deleteBudget(id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await Budget.deleteOne({ _id: id, userId });
  revalidateFinance();
  return { success: true };
}

// ─── Financial Goals ──────────────────────────────────────────────────────────

export type ClientGoal = {
  _id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  targetAmount: number; // paise
  currentAmount: number; // paise
  progressPercent: number;
  deadline: string | null;
  status: "active" | "achieved" | "paused";
  achievedAt: string | null;
  createdAt: string;
};

function serializeGoal(g: any): ClientGoal {
  const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
  return {
    _id: String(g._id),
    title: String(g.title),
    description: String(g.description ?? ""),
    icon: String(g.icon ?? "🎯"),
    color: String(g.color ?? "#58cc02"),
    targetAmount: Number(g.targetAmount),
    currentAmount: Number(g.currentAmount),
    progressPercent: pct,
    deadline: g.deadline ? new Date(g.deadline).toISOString() : null,
    status: g.status as "active" | "achieved" | "paused",
    achievedAt: g.achievedAt ? new Date(g.achievedAt).toISOString() : null,
    createdAt: new Date(g.createdAt).toISOString(),
  };
}

export async function getFinancialGoals(): Promise<ClientGoal[]> {
  const userId = await requireUser();
  await connectToDatabase();
  const goals = await FinancialGoal.find({ userId }).sort({ status: 1, createdAt: -1 }).lean();
  return goals.map(serializeGoal);
}

export async function createGoal(data: {
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  targetAmountRupees: number;
  deadline?: string;
}) {
  const userId = await requireUser();
  await connectToDatabase();

  const targetAmount = rupeesToPaise(data.targetAmountRupees);
  if (targetAmount <= 0) return { success: false, error: "INVALID_AMOUNT", message: "Target must be greater than 0." };

  await FinancialGoal.create({
    userId,
    title: data.title,
    description: data.description,
    icon: data.icon ?? "🎯",
    color: data.color ?? "#58cc02",
    targetAmount,
    currentAmount: 0,
    deadline: data.deadline ? new Date(`${data.deadline}T12:00:00+05:30`) : undefined,
    status: "active",
  });

  revalidateFinance();
  return { success: true };
}

export async function updateGoal(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    icon: string;
    color: string;
    targetAmountRupees: number;
    deadline: string;
    status: "active" | "achieved" | "paused";
  }>
) {
  const userId = await requireUser();
  await connectToDatabase();

  const update: any = { ...data };
  if (data.targetAmountRupees !== undefined) {
    update.targetAmount = rupeesToPaise(data.targetAmountRupees);
    delete update.targetAmountRupees;
  }
  if (data.deadline) update.deadline = new Date(`${data.deadline}T12:00:00+05:30`);

  await FinancialGoal.findOneAndUpdate({ _id: id, userId }, { $set: update });
  revalidateFinance();
  return { success: true };
}

export async function contributeToGoal(id: string, amountRupees: number) {
  const userId = await requireUser();
  await connectToDatabase();

  const amount = rupeesToPaise(amountRupees);
  if (amount <= 0) return { success: false, error: "INVALID_AMOUNT", message: "Contribution must be greater than 0." };

  await FinancialGoal.findOneAndUpdate(
    { _id: id, userId },
    { $inc: { currentAmount: amount } }
  );

  const goal = await FinancialGoal.findOne({ _id: id, userId });
  if (goal && goal.currentAmount >= goal.targetAmount && goal.status !== "achieved") {
    await FinancialGoal.findByIdAndUpdate(id, { status: "achieved", achievedAt: new Date() });
  }

  revalidateFinance();
  return { success: true };
}

export async function deleteGoal(id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await FinancialGoal.deleteOne({ _id: id, userId });
  revalidateFinance();
  return { success: true };
}

// ─── Recurring Templates ──────────────────────────────────────────────────────

export type ClientRecurringTemplate = {
  _id: string;
  type: TransactionType;
  amount: number; // paise
  description: string;
  categoryId: string;
  categoryName: string;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  nextDue: string;
  isActive: boolean;
  endDate: string | null;
  createdAt: string;
};

function serializeTemplate(t: any): ClientRecurringTemplate {
  return {
    _id: String(t._id),
    type: t.type as TransactionType,
    amount: Number(t.amount),
    description: String(t.description),
    categoryId: String(t.categoryId ?? ""),
    categoryName: String(t.categoryName ?? ""),
    paymentMethod: (t.paymentMethod ?? "UPI") as PaymentMethod,
    frequency: t.frequency as RecurringFrequency,
    nextDue: new Date(t.nextDue).toISOString(),
    isActive: Boolean(t.isActive),
    endDate: t.endDate ? new Date(t.endDate).toISOString() : null,
    createdAt: new Date(t.createdAt).toISOString(),
  };
}

export async function getRecurringTemplates(): Promise<ClientRecurringTemplate[]> {
  const userId = await requireUser();
  await connectToDatabase();
  const templates = await RecurringTemplate.find({ userId }).sort({ nextDue: 1 }).lean();
  return templates.map(serializeTemplate);
}

export async function createRecurringTemplate(data: {
  type: TransactionType;
  amountRupees: number;
  description: string;
  categoryId?: string;
  categoryName?: string;
  paymentMethod?: PaymentMethod;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
}) {
  const userId = await requireUser();
  await connectToDatabase();

  const amount = rupeesToPaise(data.amountRupees);
  if (amount <= 0) return { success: false, error: "INVALID_AMOUNT", message: "Amount must be greater than 0." };

  const nextDue = new Date(`${data.startDate}T12:00:00+05:30`);

  await RecurringTemplate.create({
    userId,
    type: data.type,
    amount,
    description: data.description,
    categoryId: data.categoryId,
    categoryName: data.categoryName,
    paymentMethod: data.paymentMethod ?? "UPI",
    frequency: data.frequency,
    nextDue,
    isActive: true,
  });

  revalidateFinance();
  return { success: true };
}

export async function deleteRecurringTemplate(id: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await RecurringTemplate.findOneAndUpdate({ _id: id, userId }, { isActive: false });
  revalidateFinance();
  return { success: true };
}

/**
 * Generate transactions for all overdue recurring templates.
 * Call this on Finance page load. Safe to call repeatedly.
 */
export async function generateDueRecurring(): Promise<{ generated: number }> {
  const userId = await requireUser();
  await connectToDatabase();

  const mongoose = await import("mongoose");
  const now = new Date();

  const templates = await RecurringTemplate.find({
    userId,
    isActive: true,
    nextDue: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gt: now } }],
  }).lean();

  let generated = 0;

  for (const tpl of templates) {
    let due = new Date(tpl.nextDue);
    // Generate all overdue instances (up to 12 to avoid runaway)
    let count = 0;
    while (due <= now && count < 12) {
      await Transaction.create({
        userId: mongoose.Types.ObjectId.createFromHexString(userId),
        type: tpl.type,
        amount: tpl.amount,
        date: due,
        description: tpl.description,
        categoryId: tpl.categoryId,
        categoryName: tpl.categoryName,
        paymentMethod: tpl.paymentMethod,
        tags: [],
        isRecurring: true,
        recurringTemplateId: tpl._id,
      });
      due = advanceByFrequency(due, tpl.frequency as any);
      generated++;
      count++;
    }

    // Update nextDue
    await RecurringTemplate.findByIdAndUpdate(tpl._id, { nextDue: due });
  }

  if (generated > 0) revalidateFinance();
  return { generated };
}

// ─── Dashboard snapshot (used by main dashboard) ──────────────────────────────

export type FinanceSnapshot = {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  savingsRate: number;
  budgetHealth: "good" | "warn" | "bad";
  overBudgetCount: number;
};

export async function getFinanceSnapshot(): Promise<FinanceSnapshot | null> {
  try {
    const userId = await requireUser();
    await connectToDatabase();

    const m = monthKey();
    const { start, end } = monthBounds(m);

    const mongoose = await import("mongoose");
    const uid = mongoose.Types.ObjectId.createFromHexString(userId);

    const [totals, budgets, spendByCategory] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: uid, date: { $gte: start, $lt: end } } },
        { $group: { _id: "$type", total: { $sum: "$amount" } } },
      ]),
      Budget.find({ userId, month: m }).lean(),
      Transaction.aggregate([
        { $match: { userId: uid, type: "expense", date: { $gte: start, $lt: end } } },
        { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
      ]),
    ]);

    let totalIncome = 0, totalExpense = 0;
    for (const row of totals) {
      if (row._id === "income") totalIncome = row.total;
      else totalExpense = row.total;
    }

    const spendMap = new Map(spendByCategory.map((r: any) => [r._id, r.total]));
    let overBudgetCount = 0;
    for (const b of budgets) {
      const spent = spendMap.get(b.categoryId) ?? 0;
      if (spent > b.amount) overBudgetCount++;
    }

    const budgetHealth = overBudgetCount === 0 ? "good" : overBudgetCount <= 2 ? "warn" : "bad";
    const netFlow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netFlow / totalIncome) * 100) : 0;

    return { month: m, totalIncome, totalExpense, netFlow, savingsRate, budgetHealth, overBudgetCount };
  } catch {
    return null;
  }
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export async function getFinancialInsights(month?: string) {
  const userId = await requireUser();
  await connectToDatabase();

  const m = month ?? monthKey();
  const prevMonth = (() => {
    const [y, mo] = m.split("-").map(Number);
    if (mo === 1) return `${y - 1}-12`;
    return `${y}-${String(mo - 1).padStart(2, "0")}`;
  })();

  const [thisSum, lastSum, goals, budgets] = await Promise.all([
    getMonthlySummary(m),
    getMonthlySummary(prevMonth),
    getFinancialGoals(),
    getBudgets(m),
  ]);

  const budgetMap = new Map(budgets.map((b) => [b.categoryId, b.amount]));
  const categoryBreakdown = thisSum.categoryBreakdown.map((c) => ({
    ...c,
    categoryName: c.categoryName,
    budget: budgetMap.get(c.categoryId),
  }));

  return generateInsights({
    thisMonth: { totalIncome: thisSum.totalIncome, totalExpense: thisSum.totalExpense },
    lastMonth: { totalIncome: lastSum.totalIncome, totalExpense: lastSum.totalExpense },
    categoryBreakdown,
    goals: goals
      .filter((g) => g.status === "active")
      .map((g) => ({ ...g, deadline: g.deadline ?? undefined })),
  });
}
