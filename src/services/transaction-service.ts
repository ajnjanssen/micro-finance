/**
 * Transaction Service
 * Handles all transaction-related operations: filtering, aggregation, recurring logic
 * All components MUST use this service - NO transaction logic in components
 */

import { FREQUENCY_TO_MONTHLY, type Frequency } from "@/constants/categories";
import { CategoryService } from "./category-service";
import type { Transaction } from "@/types/finance";

export class TransactionService {
  private static instance: TransactionService;
  private categoryService: CategoryService;

  private constructor() {
    this.categoryService = CategoryService.getInstance();
  }

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  /**
   * Filter transactions by date range
   *
   * @param transactions - All transactions
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Filtered transactions
   */
  filterByDateRange(
    transactions: Transaction[],
    startDate: Date,
    endDate: Date
  ): Transaction[] {
    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });
  }

  /**
   * Filter transactions by type
   *
   * @param transactions - All transactions
   * @param type - 'income' | 'expense'
   * @returns Filtered transactions
   */
  filterByType(
    transactions: Transaction[],
    type: "income" | "expense"
  ): Transaction[] {
    return transactions.filter((t) => {
      // If type is explicitly set, use it
      if (t.type) return t.type === type;
      // Otherwise infer from amount
      return type === "expense" ? t.amount < 0 : t.amount > 0;
    });
  }

  /**
   * Filter recurring transactions
   *
   * @param transactions - All transactions
   * @returns Only recurring transactions
   */
  filterRecurring(transactions: Transaction[]): Transaction[] {
    return transactions.filter((t) => t.isRecurring);
  }

  /**
   * Filter non-savings transactions (excludes old savings transactions)
   *
   * @param transactions - All transactions
   * @returns Transactions excluding savings-related ones
   */
  filterNonSavingsTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.filter((t) => {
      return !this.categoryService.isSavingsTransaction(t.description);
    });
  }

  /**
   * Filter completed transactions
   *
   * @param transactions - All transactions
   * @returns Only completed transactions
   */
  filterCompleted(transactions: Transaction[]): Transaction[] {
    return transactions.filter((t) => t.completed);
  }

  /**
   * Check if a recurring transaction occurs in a specific month
   *
   * @param transaction - The transaction to check
   * @param targetDate - The month to check (any date in that month)
   * @returns True if transaction occurs in this month
   */
  occursInMonth(transaction: Transaction, targetDate: Date): boolean {
    if (!transaction.isRecurring) return false;

    const txDate = new Date(transaction.date);
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    if (transaction.recurringType === "monthly") {
      // Monthly transactions occur every month if they've started
      return (
        txDate.getFullYear() < targetYear ||
        (txDate.getFullYear() === targetYear &&
          txDate.getMonth() <= targetMonth)
      );
    }

    if (transaction.recurringType === "yearly") {
      // Yearly transactions only occur in their specific month
      return txDate.getMonth() === targetMonth;
    }

    // Note: Transactions don't have quarterly type, but expenses from config do
    // This is handled in the expense configuration, not transaction level

    return false;
  }

  /**
   * Get monthly amount for a transaction (handles frequency conversion)
   *
   * @param transaction - Transaction with amount and recurring type
   * @returns Monthly amount
   */
  getMonthlyAmount(transaction: Transaction): number {
    if (!transaction.isRecurring) {
      return Math.abs(transaction.amount);
    }

    const frequency = transaction.recurringType as Frequency;
    const multiplier = FREQUENCY_TO_MONTHLY[frequency] || 1;
    return Math.abs(transaction.amount) * multiplier;
  }

  /**
   * Aggregate transactions by category
   *
   * @param transactions - Transactions to aggregate
   * @returns Map of category to total amount
   */
  aggregateByCategory(transactions: Transaction[]): Map<string, number> {
    const aggregated = new Map<string, number>();

    for (const transaction of transactions) {
      const category = this.categoryService.normalizeCategory(
        transaction.category || "uncategorized"
      );
      const current = aggregated.get(category) || 0;
      aggregated.set(category, current + Math.abs(transaction.amount));
    }

    return aggregated;
  }

  /**
   * Get expense transactions for a specific month (excluding savings)
   *
   * @param transactions - All transactions
   * @param year - Year
   * @param month - Month (1-12)
   * @returns Expense transactions for that month
   */
  getMonthExpenses(
    transactions: Transaction[],
    year: number,
    month: number
  ): Transaction[] {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.filterByDateRange(
      this.filterNonSavingsTransactions(
        this.filterByType(transactions, "expense")
      ),
      startDate,
      endDate
    );
  }

  /**
   * Get total amount from transactions
   *
   * @param transactions - Transactions to sum
   * @returns Total amount (absolute value)
   */
  getTotalAmount(transactions: Transaction[]): number {
    return transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  /**
   * Calculate average monthly spending from recent transactions
   *
   * @param transactions - All transactions
   * @param monthsBack - How many months to look back (default: 3)
   * @param excludeLargeTransactions - Exclude transactions over this amount (default: 200)
   * @returns Map of category to average monthly amount
   */
  calculateAverageMonthlySpending(
    transactions: Transaction[],
    monthsBack: number = 3,
    excludeLargeTransactions: number = 200
  ): Map<string, number> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - monthsBack);

    // Get recent expenses (exclude large one-time purchases)
    const recentExpenses = this.filterByType(transactions, "expense").filter(
      (t) => {
        return (
          new Date(t.date) >= threeMonthsAgo &&
          Math.abs(t.amount) <= excludeLargeTransactions
        );
      }
    );

    // Count actual months with data
    const monthsWithData = new Set<string>();
    recentExpenses.forEach((t) => {
      monthsWithData.add(t.date.substring(0, 7)); // YYYY-MM
    });
    const monthCount = Math.max(monthsWithData.size, 1);

    // Aggregate by category
    const aggregated = this.aggregateByCategory(recentExpenses);

    // Convert to average
    const averages = new Map<string, number>();
    for (const [category, total] of aggregated.entries()) {
      averages.set(category, total / monthCount);
    }

    return averages;
  }
}
