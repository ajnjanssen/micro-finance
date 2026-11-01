import {
  convertToMonthly,
  type RecurringExpense,
} from "@/types/financial-config";
import type { SavingsGoal } from "@/types/savings-goals";

export function getUniqueRecurringExpenses(
  expenses: RecurringExpense[],
): RecurringExpense[] {
  const generatedDebtExpenses = expenses.filter((expense) =>
    expense.id.startsWith("debt-recurring-"),
  );

  return expenses.filter((expense) => {
    if (expense.id.startsWith("debt-recurring-")) return true;

    const normalizedName = expense.name
      .toLowerCase()
      .replace(/^schuld\s*:\s*/, "")
      .replace(/[^a-z0-9]/g, "");

    return !generatedDebtExpenses.some((debtExpense) => {
      const debtName = debtExpense.name
        .toLowerCase()
        .replace(/^schuld\s*:\s*/, "")
        .replace(/[^a-z0-9]/g, "");
      const sameName = normalizedName === debtName;
      const sameAmount =
        Math.abs(
          convertToMonthly(expense.amount, expense.frequency) -
            convertToMonthly(debtExpense.amount, debtExpense.frequency),
        ) < 0.01;

      return sameName && sameAmount;
    });
  });
}

export function isRecurringExpenseActiveInMonth(
  expense: RecurringExpense,
  month: Date,
): boolean {
  if (!expense.isActive) return false;

  const monthKey = `${month.getFullYear()}-${String(
    month.getMonth() + 1,
  ).padStart(2, "0")}`;
  const startMonth = expense.startDate.slice(0, 7);
  const endMonth = expense.endDate?.slice(0, 7);

  return startMonth <= monthKey && (!endMonth || endMonth >= monthKey);
}

export function isSavingsGoalActiveInMonth(
  goal: SavingsGoal & { isActive?: boolean },
  month: Date,
): boolean {
  if (
    goal.isActive === false ||
    goal.spentDate ||
    goal.completedDate ||
    !goal.monthlyContribution ||
    goal.monthlyContribution <= 0 ||
    goal.targetAmount <= 0 ||
    goal.currentAmount >= goal.targetAmount
  ) {
    return false;
  }

  const monthKey = `${month.getFullYear()}-${String(
    month.getMonth() + 1,
  ).padStart(2, "0")}`;
  const startMonth = goal.startDate?.slice(0, 7);
  const endMonth = goal.endDate?.slice(0, 7);

  return (
    (!startMonth || startMonth <= monthKey) &&
    (!endMonth || endMonth >= monthKey)
  );
}

export function findMatchingSavingsGoal(
  expense: RecurringExpense,
  goals: SavingsGoal[],
  defaultFromAccountId: string | undefined,
  defaultToAccountId: string | undefined,
  monthKey: string,
): SavingsGoal | undefined {
  const monthlyAmount = convertToMonthly(expense.amount, expense.frequency);
  const fromAccountId = expense.accountId || defaultFromAccountId;

  return goals.find((goal) => {
    if (
      goal.spentDate ||
      !goal.monthlyContribution ||
      goal.monthlyContribution <= 0 ||
      goal.targetAmount <= 0 ||
      Math.abs(goal.monthlyContribution - monthlyAmount) >= 0.01
    ) {
      return false;
    }

    if (
      (goal.fromAccountId || defaultFromAccountId) !== fromAccountId ||
      (goal.toAccountId || defaultToAccountId) !== defaultToAccountId
    ) {
      return false;
    }

    return (
      (!goal.startDate || goal.startDate.slice(0, 7) <= monthKey) &&
      (!goal.endDate || goal.endDate.slice(0, 7) >= monthKey)
    );
  });
}
