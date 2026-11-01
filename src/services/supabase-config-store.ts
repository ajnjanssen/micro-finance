import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Asset, Debt } from "@/types/assets-liabilities";
import type {
  SavingsGoal as ConfigSavingsGoal,
  FinancialConfiguration,
  IncomeSource,
  OneTimeExpense,
  RecurringExpense,
  StartingBalance,
} from "@/types/financial-config";

type ProfileRow = {
  starting_balance: FinancialConfiguration["startingBalance"];
  settings: FinancialConfiguration["settings"];
  budget_category_mappings: FinancialConfiguration["budgetCategoryMappings"];
  last_updated: string;
} | null;

function normalizeStartingBalance(value: unknown): StartingBalance {
  const startingBalance =
    value && typeof value === "object"
      ? (value as Partial<StartingBalance>)
      : {};
  return {
    date:
      typeof startingBalance.date === "string"
        ? startingBalance.date
        : new Date().toISOString().slice(0, 10),
    checking:
      typeof startingBalance.checking === "number" &&
      Number.isFinite(startingBalance.checking)
        ? startingBalance.checking
        : 0,
    savings:
      typeof startingBalance.savings === "number" &&
      Number.isFinite(startingBalance.savings)
        ? startingBalance.savings
        : 0,
    ...(startingBalance.other ? { other: startingBalance.other } : {}),
  };
}

function throwOnError(error: { message: string } | null): void {
  if (error) {
    throw new Error(
      `Supabase configuration operation failed: ${error.message}`,
    );
  }
}

function mapAsset(row: Record<string, unknown>): Asset {
  return {
    id: String(row.id),
    name: String(row.name),
    type: row.type as Asset["type"],
    ...(row.description ? { description: String(row.description) } : {}),
    currentValue: Number(row.current_value),
    ...(row.purchase_price !== null
      ? { purchasePrice: Number(row.purchase_price) }
      : {}),
    ...(row.purchase_date ? { purchaseDate: String(row.purchase_date) } : {}),
    ...(row.appreciation_rate !== null
      ? { appreciationRate: Number(row.appreciation_rate) }
      : {}),
    ...(row.depreciation_rate !== null
      ? { depreciationRate: Number(row.depreciation_rate) }
      : {}),
    isActive: Boolean(row.is_active),
    lastUpdated: String(row.last_updated),
    ...(row.location ? { location: String(row.location) } : {}),
    ...(row.notes ? { notes: String(row.notes) } : {}),
  };
}

function mapDebt(row: Record<string, unknown>): Debt {
  return {
    id: String(row.id),
    name: String(row.name),
    type: row.type as Debt["type"],
    ...(row.description ? { description: String(row.description) } : {}),
    originalAmount: Number(row.original_amount),
    currentBalance: Number(row.current_balance),
    interestRate: Number(row.interest_rate),
    ...(row.monthly_payment !== null
      ? { monthlyPayment: Number(row.monthly_payment) }
      : {}),
    ...(row.payment_frequency
      ? { paymentFrequency: row.payment_frequency as Debt["paymentFrequency"] }
      : {}),
    ...(row.minimum_payment !== null
      ? { minimumPayment: Number(row.minimum_payment) }
      : {}),
    startDate: String(row.start_date),
    ...(row.end_date ? { endDate: String(row.end_date) } : {}),
    isActive: Boolean(row.is_active),
    lastUpdated: String(row.last_updated),
    ...(row.creditor ? { creditor: String(row.creditor) } : {}),
    ...(row.account_number
      ? { accountNumber: String(row.account_number) }
      : {}),
    ...(row.notes ? { notes: String(row.notes) } : {}),
  };
}

export async function loadUserFinancialConfig(): Promise<FinancialConfiguration> {
  const supabase = await createSupabaseServerClient();
  const [
    profileResult,
    incomeResult,
    expensesResult,
    oneTimeResult,
    goalsResult,
    assetsResult,
    liabilitiesResult,
  ] = await Promise.all([
    supabase
      .from("financial_profiles")
      .select("starting_balance,settings,budget_category_mappings,last_updated")
      .maybeSingle(),
    supabase.from("income_sources").select("*").order("name"),
    supabase.from("recurring_expenses").select("*").order("name"),
    supabase.from("one_time_expenses").select("*").order("expense_date"),
    supabase.from("config_savings_goals").select("*").order("name"),
    supabase.from("assets").select("*").order("name"),
    supabase.from("liabilities").select("*").order("name"),
  ]);
  for (const result of [
    profileResult,
    incomeResult,
    expensesResult,
    oneTimeResult,
    goalsResult,
    assetsResult,
    liabilitiesResult,
  ]) {
    throwOnError(result.error);
  }

  const profile = profileResult.data as ProfileRow;
  const incomeSources: IncomeSource[] = (incomeResult.data ?? []).map(
    (row) => ({
      id: row.id,
      name: row.name,
      amount: Number(row.amount),
      frequency: row.frequency,
      ...(row.day_of_month !== null ? { dayOfMonth: row.day_of_month } : {}),
      startDate: row.start_date,
      ...(row.end_date ? { endDate: row.end_date } : {}),
      isActive: row.is_active,
      ...(row.notes ? { notes: row.notes } : {}),
      ...(row.account_id ? { accountId: row.account_id } : {}),
      category: row.category,
    }),
  );
  const recurringExpenses: RecurringExpense[] = (expensesResult.data ?? []).map(
    (row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      amount: Number(row.amount),
      frequency: row.frequency,
      ...(row.day_of_month !== null ? { dayOfMonth: row.day_of_month } : {}),
      startDate: row.start_date,
      ...(row.end_date ? { endDate: row.end_date } : {}),
      isActive: row.is_active,
      isEssential: row.is_essential,
      isVariable: row.is_variable,
      ...(row.estimated_variance !== null
        ? { estimatedVariance: Number(row.estimated_variance) }
        : {}),
      ...(row.budget_type ? { budgetType: row.budget_type } : {}),
      ...(row.account_id ? { accountId: row.account_id } : {}),
      ...(row.notes ? { notes: row.notes } : {}),
    }),
  );
  const oneTimeExpenses: OneTimeExpense[] = (oneTimeResult.data ?? []).map(
    (row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      amount: Number(row.amount),
      date: row.expense_date,
      isPaid: row.is_paid,
      ...(row.notes ? { notes: row.notes } : {}),
    }),
  );
  const savingsGoals: ConfigSavingsGoal[] = (goalsResult.data ?? []).map(
    (row) => ({
      id: row.id,
      name: row.name,
      targetAmount: Number(row.target_amount),
      currentAmount: Number(row.current_amount),
      ...(row.deadline ? { deadline: row.deadline } : {}),
      ...(row.monthly_contribution !== null
        ? { monthlyContribution: Number(row.monthly_contribution) }
        : {}),
      priority: row.priority,
      isActive: row.is_active,
    }),
  );

  return {
    version: "3.0",
    lastUpdated: profile?.last_updated ?? new Date().toISOString(),
    startingBalance: normalizeStartingBalance(profile?.starting_balance),
    incomeSources,
    recurringExpenses,
    oneTimeExpenses,
    savingsGoals,
    assets: (assetsResult.data ?? []).map((row) =>
      mapAsset(row as Record<string, unknown>),
    ),
    liabilities: (liabilitiesResult.data ?? []).map((row) =>
      mapDebt(row as Record<string, unknown>),
    ),
    ...(profile?.budget_category_mappings
      ? { budgetCategoryMappings: profile.budget_category_mappings }
      : {}),
    settings: profile?.settings ?? {
      defaultCurrency: "EUR",
      projectionMonths: 36,
      conservativeMode: false,
    },
  };
}

export async function saveUserFinancialConfig(
  config: FinancialConfiguration,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  throwOnError(authError);
  if (!authData.user) throw new Error("Authentication required.");
  const userId = authData.user.id;

  const profileSave = await supabase.from("financial_profiles").upsert({
    user_id: userId,
    version: config.version,
    starting_balance: config.startingBalance,
    settings: config.settings,
    budget_category_mappings: config.budgetCategoryMappings ?? {},
    last_updated: new Date().toISOString(),
  });
  throwOnError(profileSave.error);

  await Promise.all([
    syncRows(
      "income_sources",
      userId,
      config.incomeSources.map((source) => ({
        user_id: userId,
        id: source.id,
        name: source.name,
        amount: source.amount,
        frequency: source.frequency,
        day_of_month: source.dayOfMonth ?? null,
        start_date: source.startDate,
        end_date: source.endDate ?? null,
        is_active: source.isActive,
        notes: source.notes ?? null,
        account_id: source.accountId ?? null,
        category: source.category,
      })),
    ),
    syncRows(
      "recurring_expenses",
      userId,
      config.recurringExpenses.map((expense) => ({
        user_id: userId,
        id: expense.id,
        name: expense.name,
        category: expense.category,
        amount: expense.amount,
        frequency: expense.frequency,
        day_of_month: expense.dayOfMonth ?? null,
        start_date: expense.startDate,
        end_date: expense.endDate ?? null,
        is_active: expense.isActive,
        is_essential: expense.isEssential,
        is_variable: expense.isVariable,
        estimated_variance: expense.estimatedVariance ?? null,
        budget_type: expense.budgetType ?? null,
        account_id: expense.accountId ?? null,
        notes: expense.notes ?? null,
      })),
    ),
    syncRows(
      "one_time_expenses",
      userId,
      config.oneTimeExpenses.map((expense) => ({
        user_id: userId,
        id: expense.id,
        name: expense.name,
        category: expense.category,
        amount: expense.amount,
        expense_date: expense.date,
        is_paid: expense.isPaid,
        notes: expense.notes ?? null,
      })),
    ),
    syncRows(
      "config_savings_goals",
      userId,
      config.savingsGoals.map((goal) => ({
        user_id: userId,
        id: goal.id,
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        deadline: goal.deadline ?? null,
        monthly_contribution: goal.monthlyContribution ?? null,
        priority: goal.priority,
        is_active: goal.isActive,
      })),
    ),
    syncRows(
      "assets",
      userId,
      (config.assets ?? []).map((asset) => ({
        user_id: userId,
        id: asset.id,
        name: asset.name,
        type: asset.type,
        description: asset.description ?? null,
        current_value: asset.currentValue,
        purchase_price: asset.purchasePrice ?? null,
        purchase_date: asset.purchaseDate ?? null,
        appreciation_rate: asset.appreciationRate ?? null,
        depreciation_rate: asset.depreciationRate ?? null,
        is_active: asset.isActive,
        last_updated: asset.lastUpdated,
        location: asset.location ?? null,
        notes: asset.notes ?? null,
      })),
    ),
    syncRows(
      "liabilities",
      userId,
      (config.liabilities ?? []).map((debt) => ({
        user_id: userId,
        id: debt.id,
        name: debt.name,
        type: debt.type,
        description: debt.description ?? null,
        original_amount: debt.originalAmount,
        current_balance: debt.currentBalance,
        interest_rate: debt.interestRate,
        monthly_payment: debt.monthlyPayment ?? null,
        payment_frequency: debt.paymentFrequency ?? null,
        minimum_payment: debt.minimumPayment ?? null,
        start_date: debt.startDate,
        end_date: debt.endDate ?? null,
        is_active: debt.isActive,
        last_updated: debt.lastUpdated,
        creditor: debt.creditor ?? null,
        account_number: debt.accountNumber ?? null,
        notes: debt.notes ?? null,
      })),
    ),
  ]);
}

async function syncRows(
  table:
    | "income_sources"
    | "recurring_expenses"
    | "one_time_expenses"
    | "config_savings_goals"
    | "assets"
    | "liabilities",
  userId: string,
  rows: Record<string, unknown>[],
) {
  const supabase = await createSupabaseServerClient();
  const existingResult = await supabase.from(table).select("id");
  throwOnError(existingResult.error);

  if (rows.length > 0) {
    const upsertResult = await supabase.from(table).upsert(rows);
    throwOnError(upsertResult.error);
  }

  const retainedIds = new Set(rows.map((row) => String(row.id)));
  const removedIds = (existingResult.data ?? [])
    .map((row) => row.id)
    .filter((id) => !retainedIds.has(id));

  if (removedIds.length > 0) {
    const deleteResult = await supabase
      .from(table)
      .delete()
      .eq("user_id", userId)
      .in("id", removedIds);
    throwOnError(deleteResult.error);
  }
}
