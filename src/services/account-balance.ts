import type { Account, Transaction } from "@/types/finance";

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[],
  asOfDate = new Date(),
): Record<string, number> {
  const asOfDateKey = toDateKey(asOfDate);
  const balances: Record<string, number> = {};

  for (const account of accounts) {
    balances[account.id] = account.startingBalance || 0;
  }

  const completedTransactions = transactions.filter(
    (transaction) =>
      transaction.completed !== false &&
      transaction.date.slice(0, 10) <= asOfDateKey,
  );

  for (const transaction of completedTransactions) {
    const account = accounts.find(
      (candidate) => candidate.id === transaction.accountId,
    );
    if (
      !account ||
      (account.startDate &&
        transaction.date.slice(0, 10) < account.startDate.slice(0, 10))
    ) {
      continue;
    }

    if (transaction.type !== "transfer") {
      balances[account.id] += transaction.amount;
      continue;
    }

    const pairedTransfer = transaction.transferId
      ? completedTransactions.some(
          (candidate) =>
            candidate.id !== transaction.id &&
            candidate.transferId === transaction.transferId &&
            candidate.type === "transfer" &&
            candidate.accountId !== transaction.accountId &&
            Math.sign(candidate.amount) !== Math.sign(transaction.amount),
        )
      : false;

    if (pairedTransfer) {
      balances[account.id] += transaction.amount;
    } else if (transaction.toAccountId) {
      balances[account.id] -= Math.abs(transaction.amount);
      if (balances[transaction.toAccountId] !== undefined) {
        balances[transaction.toAccountId] += Math.abs(transaction.amount);
      }
    } else if (transaction.fromAccountId) {
      balances[account.id] += Math.abs(transaction.amount);
      if (balances[transaction.fromAccountId] !== undefined) {
        balances[transaction.fromAccountId] -= Math.abs(transaction.amount);
      }
    } else {
      balances[account.id] += transaction.amount;
    }
  }

  return balances;
}
