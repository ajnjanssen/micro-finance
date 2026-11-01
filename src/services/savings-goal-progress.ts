import { calculateAccountBalances } from "@/services/account-balance";
import type { Account, Transaction } from "@/types/finance";
import type { SavingsGoal } from "@/types/savings-goals";

interface SavingsGoalTransaction {
  savingsGoalId?: string;
  accountId?: string;
  type?: string;
  amount: number;
  completed?: boolean;
  date?: string;
  transferId?: string;
  toAccountId?: string;
  fromAccountId?: string;
}

export function getSavingsGoalCurrentAmount(
  goal: Pick<SavingsGoal, "id" | "toAccountId">,
  transactions: SavingsGoalTransaction[],
  accounts?: Account[],
  allGoals?: Pick<SavingsGoal, "id" | "toAccountId" | "spentDate">[],
): number {
  const balance = transactions.reduce((sum, transaction) => {
    if (
      transaction.savingsGoalId !== goal.id ||
      transaction.type !== "transfer" ||
      transaction.completed === false
    ) {
      return sum;
    }

    if (goal.toAccountId) {
      if (transaction.accountId === goal.toAccountId) {
        return sum + transaction.amount;
      }

      const isUnpairedDestinationTransfer =
        transaction.toAccountId === goal.toAccountId &&
        !transactions.some(
          (candidate) =>
            candidate.transferId &&
            candidate.transferId === transaction.transferId &&
            candidate.accountId === goal.toAccountId,
        );
      return isUnpairedDestinationTransfer
        ? sum + Math.abs(transaction.amount)
        : sum;
    }

    return transaction.amount > 0 ? sum + transaction.amount : sum;
  }, 0);

  let currentAmount = Math.max(0, balance);

  if (
    goal.toAccountId &&
    accounts &&
    allGoals?.filter(
      (candidate) =>
        candidate.toAccountId === goal.toAccountId && !candidate.spentDate,
    ).length === 1
  ) {
    const balanceTransactions: Transaction[] = transactions.map(
      (transaction, index) => ({
        id: `goal-progress-${index}`,
        description: "",
        amount: transaction.amount,
        type:
          transaction.type === "income" ||
          transaction.type === "expense" ||
          transaction.type === "transfer"
            ? transaction.type
            : transaction.amount < 0
              ? "expense"
              : "income",
        category: "transfer",
        accountId: transaction.accountId || "",
        date: transaction.date || "",
        isRecurring: false,
        completed: transaction.completed,
        toAccountId: transaction.toAccountId,
        fromAccountId: transaction.fromAccountId,
        transferId: transaction.transferId,
      }),
    );
    const accountBalance = calculateAccountBalances(
      accounts,
      balanceTransactions,
    )[goal.toAccountId];

    if (accountBalance !== undefined) {
      currentAmount = Math.max(0, accountBalance);
    }
  }

  return currentAmount;
}
