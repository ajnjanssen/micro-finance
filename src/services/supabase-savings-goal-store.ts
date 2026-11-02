import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Transaction } from "@/types/finance";
import type { SavingsGoal } from "@/types/savings-goals";
import {
  deletePendingGoalTransfers,
  insertUserTransactions,
} from "./supabase-financial-store";

type GoalRow = {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  category_id: string | null;
  deadline: string | null;
  priority: SavingsGoal["priority"];
  budget_type: SavingsGoal["budgetType"] | null;
  image_url: string | null;
  image_urls: string[] | null;
  source_url: string | null;
  monthly_contribution: number | null;
  tags: string[] | null;
  from_account_id: string | null;
  to_account_id: string | null;
  start_date: string | null;
  end_date: string | null;
  completed_date: string | null;
  spent_date: string | null;
  spent_transaction_id: string | null;
  created_at: string;
  updated_at: string;
};

function throwOnError(error: { message: string } | null): void {
  if (error) {
    throw new Error(`Supabase savings-goal operation failed: ${error.message}`);
  }
}

function mapGoal(row: GoalRow): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    ...(row.category_id ? { categoryId: row.category_id } : {}),
    ...(row.deadline ? { deadline: row.deadline } : {}),
    priority: row.priority,
    ...(row.budget_type ? { budgetType: row.budget_type } : {}),
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    ...(row.image_urls ? { imageUrls: row.image_urls } : {}),
    ...(row.source_url ? { sourceUrl: row.source_url } : {}),
    ...(row.monthly_contribution !== null
      ? { monthlyContribution: Number(row.monthly_contribution) }
      : {}),
    ...(row.tags ? { tags: row.tags } : {}),
    ...(row.from_account_id ? { fromAccountId: row.from_account_id } : {}),
    ...(row.to_account_id ? { toAccountId: row.to_account_id } : {}),
    ...(row.start_date ? { startDate: row.start_date } : {}),
    ...(row.end_date ? { endDate: row.end_date } : {}),
    ...(row.completed_date ? { completedDate: row.completed_date } : {}),
    ...(row.spent_date ? { spentDate: row.spent_date } : {}),
    ...(row.spent_transaction_id
      ? { spentTransactionId: row.spent_transaction_id }
      : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toGoalRow(goal: SavingsGoal) {
  return {
    id: goal.id,
    name: goal.name,
    description: goal.description ?? null,
    target_amount: goal.targetAmount,
    current_amount: goal.currentAmount,
    category_id: goal.categoryId ?? null,
    deadline: goal.deadline ?? null,
    priority: goal.priority,
    budget_type: goal.budgetType ?? null,
    image_url: goal.imageUrl ?? null,
    image_urls: goal.imageUrls ?? null,
    source_url: goal.sourceUrl ?? null,
    monthly_contribution: goal.monthlyContribution ?? null,
    tags: goal.tags ?? null,
    from_account_id: goal.fromAccountId ?? null,
    to_account_id: goal.toAccountId ?? null,
    start_date: goal.startDate ?? null,
    end_date: goal.endDate ?? null,
    completed_date: goal.completedDate ?? null,
    spent_date: goal.spentDate ?? null,
    spent_transaction_id: goal.spentTransactionId ?? null,
    created_at: goal.createdAt,
    updated_at: goal.updatedAt,
  };
}

export async function listUserSavingsGoals(): Promise<SavingsGoal[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .order("created_at", { ascending: false });
  throwOnError(error);
  return (data ?? []).map((row) => mapGoal(row as GoalRow));
}

export async function insertUserSavingsGoal(
  goal: SavingsGoal,
): Promise<SavingsGoal> {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  throwOnError(userError);
  if (!userData.user) throw new Error("Authentication required.");
  const { data, error } = await supabase
    .from("savings_goals")
    .insert({ user_id: userData.user.id, ...toGoalRow(goal) })
    .select("*")
    .single();
  throwOnError(error);
  return mapGoal(data as GoalRow);
}

export async function upsertUserSavingsGoals(
  goals: SavingsGoal[],
): Promise<void> {
  if (goals.length === 0) return;

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  throwOnError(userError);
  if (!userData.user) throw new Error("Authentication required.");

  const { error } = await supabase.from("savings_goals").upsert(
    goals.map((goal) => ({
      user_id: userData.user.id,
      ...toGoalRow(goal),
    })),
    { onConflict: "user_id,id" },
  );
  throwOnError(error);
}

export async function updateUserSavingsGoal(
  id: string,
  updates: Partial<SavingsGoal>,
): Promise<SavingsGoal | null> {
  const supabase = await createSupabaseServerClient();
  const current = await supabase
    .from("savings_goals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwOnError(current.error);
  if (!current.data) return null;

  const merged: SavingsGoal = {
    ...mapGoal(current.data as GoalRow),
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("savings_goals")
    .update(toGoalRow(merged))
    .eq("id", id)
    .select("*")
    .single();
  throwOnError(error);
  return mapGoal(data as GoalRow);
}

export async function deleteUserSavingsGoal(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", id)
    .select("id");
  throwOnError(error);
  return (data?.length ?? 0) > 0;
}

export async function syncGoalTransfers(
  goal: SavingsGoal,
  accounts: { id: string }[],
): Promise<void> {
  const monthlyContribution = goal.monthlyContribution ?? 0;
  const sourceAccountId = goal.fromAccountId;
  const destinationAccountId = goal.toAccountId;
  if (monthlyContribution > 0 && sourceAccountId && destinationAccountId) {
    if (
      !accounts.some((account) => account.id === sourceAccountId) ||
      !accounts.some((account) => account.id === destinationAccountId)
    ) {
      throw new Error(
        "Savings goal source or destination account was not found.",
      );
    }
  }

  await deletePendingGoalTransfers(goal.id);
  if (monthlyContribution <= 0 || !sourceAccountId || !destinationAccountId) {
    return;
  }

  const timestamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const transferId = `transfer-${timestamp}`;
  const baseTransaction = {
    description: `Sparen: ${goal.name}`,
    type: "transfer" as const,
    category: "transfer",
    date: goal.startDate || new Date().toISOString().slice(0, 10),
    isRecurring: true,
    recurringType: "monthly" as const,
    tags: ["savings", "transfer"],
    categoryReason: `Maandelijkse bijdrage aan spaardoel: ${goal.name}`,
    completed: false,
    savingsGoalId: goal.id,
    transferId,
  };
  const outgoing: Transaction = {
    ...baseTransaction,
    id: `tx-${timestamp}-out`,
    amount: -monthlyContribution,
    accountId: sourceAccountId,
    toAccountId: destinationAccountId,
  };
  const incoming: Transaction = {
    ...baseTransaction,
    id: `tx-${timestamp}-in`,
    amount: monthlyContribution,
    accountId: destinationAccountId,
    fromAccountId: sourceAccountId,
  };
  await insertUserTransactions([outgoing, incoming]);
}
