import type {
  Account,
  InvestmentProjection,
  Transaction,
} from "@/types/finance";
import { calculateAccountBalances } from "./account-balance";

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function occursOnDate(transaction: Transaction, date: Date): boolean {
  const start = dateFromKey(transaction.date);
  const end = transaction.recurringEndDate
    ? dateFromKey(transaction.recurringEndDate)
    : null;
  if (date < start || (end && date > end)) return false;

  switch (transaction.recurringType) {
    case "daily":
      return true;
    case "weekly":
      return (
        Math.floor((date.getTime() - start.getTime()) / 86_400_000) % 7 === 0
      );
    case "monthly": {
      const lastDay = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
      ).getDate();
      return date.getDate() === Math.min(start.getDate(), lastDay);
    }
    case "yearly": {
      const lastDay = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
      ).getDate();
      return (
        date.getMonth() === start.getMonth() &&
        date.getDate() === Math.min(start.getDate(), lastDay)
      );
    }
    default:
      return false;
  }
}

function transferImpactForAccount(
  transaction: Transaction,
  accountId: string,
  transactions: Transaction[],
): number {
  const hasPairedAccountEntry =
    !!transaction.transferId &&
    transactions.some(
      (candidate) =>
        candidate.transferId === transaction.transferId &&
        candidate.accountId === accountId &&
        candidate.id !== transaction.id,
    );
  if (transaction.accountId === accountId) {
    if (hasPairedAccountEntry) return transaction.amount;
    if (transaction.toAccountId) return -Math.abs(transaction.amount);
    if (transaction.fromAccountId) return Math.abs(transaction.amount);
    return transaction.amount;
  }
  if (hasPairedAccountEntry) return 0;

  if (transaction.toAccountId === accountId) {
    return Math.abs(transaction.amount);
  }
  if (transaction.fromAccountId === accountId) {
    return -Math.abs(transaction.amount);
  }
  return 0;
}

function transactionOccurrencesInMonth(
  transaction: Transaction,
  year: number,
  month: number,
  afterDate: string,
): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let occurrences = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = localDateKey(date);
    if (dateKey <= afterDate) continue;

    if (transaction.isRecurring && transaction.recurringType) {
      if (occursOnDate(transaction, date)) occurrences++;
    } else if (transaction.date.slice(0, 10) === dateKey) {
      occurrences++;
    }
  }
  return occurrences;
}

export function projectInvestmentAccounts(
  accounts: Account[],
  transactions: Transaction[],
  monthsAhead = 60,
  asOfDate = new Date(),
): InvestmentProjection[] {
  const investmentAccounts = accounts.filter(
    (account) => account.type === "stocks",
  );
  if (investmentAccounts.length === 0) return [];

  const currentBalances = calculateAccountBalances(
    accounts,
    transactions,
    asOfDate,
  );
  const balances: Record<string, number> = {};
  for (const account of investmentAccounts) {
    balances[account.id] = currentBalances[account.id] || 0;
  }

  const projections: InvestmentProjection[] = [
    {
      date: localDateKey(asOfDate),
      totalBalance: Object.values(balances).reduce(
        (sum, amount) => sum + amount,
        0,
      ),
      accountBalances: { ...balances },
    },
  ];

  for (let offset = 0; offset < monthsAhead; offset++) {
    const targetMonth = new Date(
      asOfDate.getFullYear(),
      asOfDate.getMonth() + offset,
      1,
    );
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthFraction =
      offset === 0 ? (daysInMonth - asOfDate.getDate() + 1) / daysInMonth : 1;

    for (const account of investmentAccounts) {
      const annualReturn = account.expectedAnnualReturn ?? 0;
      if (
        !Number.isFinite(annualReturn) ||
        annualReturn < -100 ||
        annualReturn > 100
      ) {
        throw new Error(
          `Expected annual return for "${account.name}" must be between -100% and 100%`,
        );
      }
      const monthlyGrowthFactor =
        (1 + annualReturn / 100) ** (monthFraction / 12);
      balances[account.id] *= monthlyGrowthFactor;

      for (const transaction of transactions) {
        if (transaction.type !== "transfer") continue;
        const occurrences = transactionOccurrencesInMonth(
          transaction,
          year,
          month,
          localDateKey(asOfDate),
        );
        if (occurrences === 0) continue;
        balances[account.id] +=
          transferImpactForAccount(transaction, account.id, transactions) *
          occurrences;
      }
    }

    projections.push({
      date: localDateKey(new Date(year, month + 1, 0)),
      totalBalance: Object.values(balances).reduce(
        (sum, amount) => sum + amount,
        0,
      ),
      accountBalances: { ...balances },
    });
  }

  return projections;
}
