import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Account,
  Category,
  FinancialData,
  Transaction,
} from "@/types/finance";

type AccountRow = {
  id: string;
  name: string;
  type: Account["type"];
  starting_balance: number;
  start_date: string;
  description: string | null;
  expected_annual_return: number | null;
};

type CategoryRow = {
  id: string;
  name: string;
  type: Category["type"];
  color: string;
};

type TransactionRow = {
  id: string;
  description: string;
  amount: number;
  type: Transaction["type"];
  category: string;
  category_reason: string | null;
  account_id: string;
  transaction_date: string;
  is_recurring: boolean;
  recurring_type: Transaction["recurringType"] | null;
  recurring_end_date: string | null;
  tags: string[] | null;
  completed: boolean | null;
  completed_date: string | null;
  to_account_id: string | null;
  from_account_id: string | null;
  transfer_id: string | null;
  savings_goal_id: string | null;
};

function throwOnError(error: { message: string } | null): void {
  if (error) {
    throw new Error(
      `Supabase financial data operation failed: ${error.message}`,
    );
  }
}

async function requireUserId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  throwOnError(error);
  if (!data.user) throw new Error("Authentication required.");
  return data.user.id;
}

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    startingBalance: Number(row.starting_balance),
    startDate: row.start_date,
    ...(row.description ? { description: row.description } : {}),
    ...(row.expected_annual_return !== null
      ? { expectedAnnualReturn: Number(row.expected_annual_return) }
      : {}),
  };
}

function toAccountRow(account: Account) {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    starting_balance: account.startingBalance,
    start_date: account.startDate,
    description: account.description ?? null,
    expected_annual_return: account.expectedAnnualReturn ?? null,
  };
}

function mapCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, type: row.type, color: row.color };
}

function toCategoryRow(category: Category) {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
  };
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    accountId: row.account_id,
    date: row.transaction_date,
    isRecurring: row.is_recurring,
    ...(row.category_reason ? { categoryReason: row.category_reason } : {}),
    ...(row.recurring_type ? { recurringType: row.recurring_type } : {}),
    ...(row.recurring_end_date
      ? { recurringEndDate: row.recurring_end_date }
      : {}),
    ...(row.tags ? { tags: row.tags } : {}),
    ...(row.completed !== null ? { completed: row.completed } : {}),
    ...(row.completed_date ? { completedDate: row.completed_date } : {}),
    ...(row.to_account_id ? { toAccountId: row.to_account_id } : {}),
    ...(row.from_account_id ? { fromAccountId: row.from_account_id } : {}),
    ...(row.transfer_id ? { transferId: row.transfer_id } : {}),
    ...(row.savings_goal_id ? { savingsGoalId: row.savings_goal_id } : {}),
  };
}

function toTransactionRow(transaction: Transaction) {
  return {
    id: transaction.id,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    category_reason: transaction.categoryReason ?? null,
    account_id: transaction.accountId,
    transaction_date: transaction.date,
    is_recurring: transaction.isRecurring,
    recurring_type: transaction.recurringType ?? null,
    recurring_end_date: transaction.recurringEndDate ?? null,
    tags: transaction.tags ?? null,
    completed: transaction.completed ?? null,
    completed_date: transaction.completedDate ?? null,
    to_account_id: transaction.toAccountId ?? null,
    from_account_id: transaction.fromAccountId ?? null,
    transfer_id: transaction.transferId ?? null,
    savings_goal_id: transaction.savingsGoalId ?? null,
  };
}

export async function loadUserFinancialData(): Promise<FinancialData> {
  const supabase = await createSupabaseServerClient();
  const [accountsResult, transactionsResult, categoriesResult, profileResult] =
    await Promise.all([
      supabase
        .from("accounts")
        .select(
          "id,name,type,starting_balance,start_date,description,expected_annual_return",
        )
        .order("name"),
      supabase
        .from("transactions")
        .select(
          "id,description,amount,type,category,category_reason,account_id,transaction_date,is_recurring,recurring_type,recurring_end_date,tags,completed,completed_date,to_account_id,from_account_id,transfer_id,savings_goal_id",
        )
        .order("transaction_date", { ascending: false }),
      supabase.from("categories").select("id,name,type,color").order("name"),
      supabase.from("financial_profiles").select("last_updated").maybeSingle(),
    ]);

  throwOnError(accountsResult.error);
  throwOnError(transactionsResult.error);
  throwOnError(categoriesResult.error);
  throwOnError(profileResult.error);

  return {
    accounts: (accountsResult.data ?? []).map((row) =>
      mapAccount(row as AccountRow),
    ),
    transactions: (transactionsResult.data ?? []).map((row) =>
      mapTransaction(row as TransactionRow),
    ),
    categories: (categoriesResult.data ?? []).map((row) =>
      mapCategory(row as CategoryRow),
    ),
    lastUpdated: profileResult.data?.last_updated ?? new Date().toISOString(),
  };
}

export async function insertUserAccount(account: Account): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await requireUserId(supabase);
  const { error } = await supabase
    .from("accounts")
    .insert({ user_id: userId, ...toAccountRow(account) });
  throwOnError(error);
  await touchFinancialProfile();
}

export async function updateUserAccount(
  id: string,
  updates: Partial<Account>,
): Promise<Account | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .update({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.type !== undefined ? { type: updates.type } : {}),
      ...(updates.startingBalance !== undefined
        ? { starting_balance: updates.startingBalance }
        : {}),
      ...(updates.startDate !== undefined
        ? { start_date: updates.startDate }
        : {}),
      ...(updates.description !== undefined
        ? { description: updates.description }
        : {}),
      ...(updates.expectedAnnualReturn !== undefined
        ? { expected_annual_return: updates.expectedAnnualReturn }
        : {}),
    })
    .eq("id", id)
    .select(
      "id,name,type,starting_balance,start_date,description,expected_annual_return",
    )
    .maybeSingle();

  throwOnError(error);
  if (!data) return null;
  await touchFinancialProfile();
  return mapAccount(data as AccountRow);
}

export async function deleteUserAccount(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id)
    .select("id");
  throwOnError(error);
  if ((data?.length ?? 0) > 0) await touchFinancialProfile();
  return (data?.length ?? 0) > 0;
}

export async function insertUserCategory(category: Category): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await requireUserId(supabase);
  const { error } = await supabase
    .from("categories")
    .insert({ user_id: userId, ...toCategoryRow(category) });
  throwOnError(error);
  await touchFinancialProfile();
}

export async function updateUserCategory(
  id: string,
  updates: Partial<Category>,
): Promise<Category | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .update({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.type !== undefined ? { type: updates.type } : {}),
      ...(updates.color !== undefined ? { color: updates.color } : {}),
    })
    .eq("id", id)
    .select("id,name,type,color")
    .maybeSingle();
  throwOnError(error);
  if (!data) return null;
  await touchFinancialProfile();
  return mapCategory(data as CategoryRow);
}

export async function deleteUserCategory(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .select("id");
  throwOnError(error);
  if ((data?.length ?? 0) > 0) await touchFinancialProfile();
  return (data?.length ?? 0) > 0;
}

export async function insertUserTransaction(
  transaction: Transaction,
): Promise<void> {
  await insertUserTransactions([transaction]);
}

export async function insertUserTransactions(
  transactions: Transaction[],
): Promise<void> {
  if (transactions.length === 0) return;
  const supabase = await createSupabaseServerClient();
  const userId = await requireUserId(supabase);
  const { error } = await supabase.from("transactions").insert(
    transactions.map((transaction) => ({
      user_id: userId,
      ...toTransactionRow(transaction),
    })),
  );
  throwOnError(error);
  await touchFinancialProfile();
}

export async function updateUserTransaction(
  id: string,
  updates: Partial<Transaction>,
): Promise<Transaction | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .update({
      ...(updates.description !== undefined
        ? { description: updates.description }
        : {}),
      ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
      ...(updates.type !== undefined ? { type: updates.type } : {}),
      ...(updates.category !== undefined ? { category: updates.category } : {}),
      ...(updates.categoryReason !== undefined
        ? { category_reason: updates.categoryReason }
        : {}),
      ...(updates.accountId !== undefined
        ? { account_id: updates.accountId }
        : {}),
      ...(updates.date !== undefined ? { transaction_date: updates.date } : {}),
      ...(updates.isRecurring !== undefined
        ? { is_recurring: updates.isRecurring }
        : {}),
      ...(updates.recurringType !== undefined
        ? { recurring_type: updates.recurringType }
        : {}),
      ...(updates.recurringEndDate !== undefined
        ? { recurring_end_date: updates.recurringEndDate }
        : {}),
      ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
      ...(updates.completed !== undefined
        ? { completed: updates.completed }
        : {}),
      ...(updates.completedDate !== undefined
        ? { completed_date: updates.completedDate }
        : {}),
      ...(updates.toAccountId !== undefined
        ? { to_account_id: updates.toAccountId }
        : {}),
      ...(updates.fromAccountId !== undefined
        ? { from_account_id: updates.fromAccountId }
        : {}),
      ...(updates.transferId !== undefined
        ? { transfer_id: updates.transferId }
        : {}),
      ...(updates.savingsGoalId !== undefined
        ? { savings_goal_id: updates.savingsGoalId }
        : {}),
    })
    .eq("id", id)
    .select(
      "id,description,amount,type,category,category_reason,account_id,transaction_date,is_recurring,recurring_type,recurring_end_date,tags,completed,completed_date,to_account_id,from_account_id,transfer_id,savings_goal_id",
    )
    .maybeSingle();

  throwOnError(error);
  if (!data) return null;
  await touchFinancialProfile();
  return mapTransaction(data as TransactionRow);
}

export async function deleteUserTransaction(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .select("id");
  throwOnError(error);
  if ((data?.length ?? 0) > 0) await touchFinancialProfile();
  return (data?.length ?? 0) > 0;
}

export async function resetUserFinancialData(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  for (const table of ["transactions", "categories", "accounts"] as const) {
    const { error } = await supabase.from(table).delete().not("id", "is", null);
    throwOnError(error);
  }
  await touchFinancialProfile();
}

export async function clearUserTransactions(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .not("id", "is", null)
    .select("id");
  throwOnError(error);
  if ((data?.length ?? 0) > 0) await touchFinancialProfile();
  return data?.length ?? 0;
}

export async function deletePendingGoalTransfers(
  savingsGoalId: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("savings_goal_id", savingsGoalId)
    .eq("type", "transfer")
    .eq("completed", false);
  throwOnError(error);
  await touchFinancialProfile();
}

async function touchFinancialProfile(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  throwOnError(userError);
  if (!userResult.user) throw new Error("Authentication required.");
  const { error } = await supabase.from("financial_profiles").upsert({
    user_id: userResult.user.id,
    last_updated: new Date().toISOString(),
  });
  throwOnError(error);
}
