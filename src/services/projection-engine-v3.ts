/**
 * Clean Projection Engine
 *
 * Calculates projections based ONLY on configured items.
 * No detection, no guessing, just pure calculation.
 */

import type {
  FinancialConfiguration,
  MonthlyProjection,
  IncomeSource,
  RecurringExpense,
  OneTimeExpense,
} from "@/types/financial-config";
import { convertToMonthly, occursInMonth } from "@/types/financial-config";
import { FinancialConfigService } from "./financial-config-service";
import { FinancialDataService } from "./financial-data";

export class ProjectionEngine {
  private configService: FinancialConfigService;
  private dataService: FinancialDataService;

  constructor() {
    this.configService = FinancialConfigService.getInstance();
    this.dataService = FinancialDataService.getInstance();
  }

  /**
   * Generate projections for N months based on configuration ONLY
   * Does NOT use historical transactions - only manually configured values
   */
  async generateProjections(months: number): Promise<MonthlyProjection[]> {
    const config = await this.configService.loadConfig();
    const data = await this.dataService.loadData();
    const projections: MonthlyProjection[] = [];

    // Starting balance comes from manually set account balances
    // NOT from transaction history
    const currentBalance = data.accounts.reduce(
      (sum, acc) => sum + (acc.startingBalance || 0),
      0
    );

    let balance = currentBalance;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`[ProjectionEngine] ========= STARTING PROJECTION =========`);
    console.log(
      `[ProjectionEngine] Today is: ${today.toISOString()}, Month: ${today.getMonth()}`
    );

    // Get recurring transactions
    const recurringTransactions = data.transactions.filter(
      (t) => t.isRecurring
    );

    console.log(
      `[ProjectionEngine] Recurring income transactions:`,
      recurringTransactions
        .filter((t) => t.type === "income")
        .map((t) => ({
          desc: t.description,
          date: t.date,
          type: t.recurringType,
        }))
    );

    // Generate projections
    for (let i = 0; i < months; i++) {
      const targetDate = new Date();
      targetDate.setDate(1); // Set to first of month BEFORE changing month
      targetDate.setMonth(targetDate.getMonth() + i);
      targetDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

      // Format as YYYY-MM using local time (not UTC)
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, "0");
      const monthStr = `${year}-${month}`;

      if (i <= 3) {
        console.log(
          `[ProjectionEngine] Processing month ${i}: ${monthStr}, targetMonth=${targetDate.getMonth()}`
        );
      }

      // Calculate configured income for this month
      const incomeBreakdown: { source: string; amount: number }[] = [];
      let configuredIncome = 0;

      for (const source of config.incomeSources.filter((s) => s.isActive)) {
        if (occursInMonth(source, targetDate)) {
          const amount = convertToMonthly(source.amount, source.frequency);
          incomeBreakdown.push({ source: source.name, amount });
          configuredIncome += amount;
        }
      }

      // Add recurring income transactions
      for (const transaction of recurringTransactions.filter(
        (t) => t.type === "income"
      )) {
        const occurs = this.transactionOccursInMonth(transaction, targetDate);
        if (transaction.recurringType === "yearly") {
          console.log(
            `[ProjectionEngine] ${
              transaction.description
            } in ${monthStr}: occurs=${occurs}, targetMonth=${targetDate.getMonth()}, txDate=${
              transaction.date
            }`
          );
        }
        if (occurs) {
          const amount = this.getTransactionAmountForMonth(transaction);
          incomeBreakdown.push({ source: transaction.description, amount });
          configuredIncome += amount;
        }
      }

      // Calculate configured expenses for this month
      const expenseBreakdown: { name: string; amount: number }[] = [];
      let configuredExpenses = 0;

      for (const expense of config.recurringExpenses.filter(
        (e) => e.isActive
      )) {
        if (occursInMonth(expense, targetDate)) {
          const amount = convertToMonthly(expense.amount, expense.frequency);
          expenseBreakdown.push({ name: expense.name, amount });
          configuredExpenses += amount;
        }
      }

      // Add recurring expense transactions
      for (const transaction of recurringTransactions.filter(
        (t) => t.type === "expense"
      )) {
        if (this.transactionOccursInMonth(transaction, targetDate)) {
          const amount = Math.abs(
            this.getTransactionAmountForMonth(transaction)
          );
          expenseBreakdown.push({ name: transaction.description, amount });
          configuredExpenses += amount;
        }
      }

      // Add one-time expenses for this month
      for (const expense of config.oneTimeExpenses.filter((e) => !e.isPaid)) {
        const expenseDate = new Date(expense.date);
        if (
          expenseDate.getFullYear() === targetDate.getFullYear() &&
          expenseDate.getMonth() === targetDate.getMonth()
        ) {
          expenseBreakdown.push({ name: expense.name, amount: expense.amount });
          configuredExpenses += expense.amount;
        }
      }

      // Update balance based ONLY on configured amounts
      const netChange = configuredIncome - configuredExpenses;
      balance += netChange;

      // Log details for first few months
      if (i <= 2) {
        console.log(
          `[ProjectionEngine] ${monthStr}: Income=€${configuredIncome.toFixed(
            2
          )}, Sources:`,
          incomeBreakdown.map((s) => `${s.source}: €${s.amount.toFixed(2)}`)
        );
      }

      // Create projection
      const projection: MonthlyProjection = {
        month: monthStr,
        configuredIncome,
        actualIncome: 0, // Not tracking actual vs configured anymore
        configuredExpenses,
        actualExpenses: 0, // Not tracking actual vs configured anymore
        projectedBalance: balance,
        actualBalance: i === 0 ? currentBalance : undefined, // Only show current balance for first month
        incomeBreakdown,
        expenseBreakdown,
        confidence: 100, // We know exactly what's configured
        incomeVariance: undefined, // No longer comparing to actuals
        expenseVariance: undefined, // No longer comparing to actuals
      };

      projections.push(projection);
    }

    return projections;
  }

  /**
   * Get summary of current month based ONLY on configuration
   * Does NOT use historical transactions
   */
  async getCurrentMonthSummary() {
    const config = await this.configService.loadConfig();
    const data = await this.dataService.loadData();
    const today = new Date();

    console.log(`[getCurrentMonthSummary] Today: ${today.toISOString()}, Month: ${today.getMonth()}`);

    // Configured for this month
    const configuredIncome = config.incomeSources
      .filter((s) => s.isActive && occursInMonth(s, today))
      .reduce((sum, s) => sum + convertToMonthly(s.amount, s.frequency), 0);

    const configuredExpenses = config.recurringExpenses
      .filter((e) => e.isActive && occursInMonth(e, today))
      .reduce((sum, e) => sum + convertToMonthly(e.amount, e.frequency), 0);

    // Add recurring transactions for this month
    const recurringTransactions = data.transactions.filter(
      (t) => t.isRecurring
    );

    const recurringIncome = recurringTransactions
      .filter(
        (t) => t.type === "income" && this.transactionOccursInMonth(t, today)
      )
      .reduce((sum, t) => sum + this.getTransactionMonthlyAmount(t), 0);

    const recurringExpenses = recurringTransactions
      .filter(
        (t) => t.type === "expense" && this.transactionOccursInMonth(t, today)
      )
      .reduce(
        (sum, t) => sum + Math.abs(this.getTransactionMonthlyAmount(t)),
        0
      );

    // Add one-time expenses for this month
    const oneTimeExpenses = config.oneTimeExpenses
      .filter((e) => {
        if (e.isPaid) return false;
        const expenseDate = new Date(e.date);
        return (
          expenseDate.getFullYear() === today.getFullYear() &&
          expenseDate.getMonth() === today.getMonth()
        );
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const totalConfiguredIncome = configuredIncome + recurringIncome;
    const totalConfiguredExpenses =
      configuredExpenses + recurringExpenses + oneTimeExpenses;

    console.log(`[getCurrentMonthSummary] Total Income: ${totalConfiguredIncome} (configured: ${configuredIncome}, recurring: ${recurringIncome})`);

    return {
      configuredIncome: totalConfiguredIncome,
      actualIncome: 0, // Not tracking actuals
      remainingIncome: 0,

      configuredExpenses: totalConfiguredExpenses,
      actualExpenses: 0, // Not tracking actuals
      remainingExpenses: 0,

      configuredNet: totalConfiguredIncome - totalConfiguredExpenses,
      actualNet: 0,

      daysInMonth: new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).getDate(),
      daysElapsed: today.getDate(),
    };
  }

  /**
   * Check if a transaction occurs in a given month
   */
  private transactionOccursInMonth(
    transaction: any,
    targetDate: Date
  ): boolean {
    // Parse transaction date and extract year/month (avoid timezone issues)
    const txDateStr = transaction.date; // e.g., "2025-12-25"
    const [txYearStr, txMonthStr] = txDateStr.split("-");
    const txYear = Number.parseInt(txYearStr);
    const txMonth = Number.parseInt(txMonthStr) - 1; // Convert to 0-indexed
    
    // Debug log for yearly transactions
    if (transaction.recurringType === 'yearly') {
      console.log(`[transactionOccursInMonth] Checking ${transaction.description}: txDateStr=${txDateStr}, txMonth=${txMonth}, targetMonth=${targetDate.getMonth()}`);
    }

    // Check if transaction has ended
    if (transaction.recurringEndDate) {
      const endDate = new Date(transaction.recurringEndDate);
      if (targetDate > endDate) return false;
    }

    // Handle different recurring types
    switch (transaction.recurringType) {
      case "yearly":
        // Only occurs in the same month as the original transaction
        // Check if we've reached the first occurrence year AND matching month
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth();

        // Only show in months on or after the first occurrence
        if (targetYear < txYear) return false;
        if (targetYear === txYear && targetMonth < txMonth) return false;

        // Show in all future years with matching month
        return targetMonth === txMonth;

      case "quarterly":
        // Occurs every 3 months from the original date
        // Check if transaction has started
        const targetYearQ = targetDate.getFullYear();
        const targetMonthQ = targetDate.getMonth();

        if (targetYearQ < txYear) return false;
        if (targetYearQ === txYear && targetMonthQ < txMonth) return false;

        const monthsDiff =
          (targetYearQ - txYear) * 12 + (targetMonthQ - txMonth);
        return monthsDiff >= 0 && monthsDiff % 3 === 0;

      case "monthly":
      case "weekly":
      case "biweekly":
      case "daily":
      default:
        // Check if transaction has started (compare year-month only)
        const targetYearM = targetDate.getFullYear();
        const targetMonthM = targetDate.getMonth();

        if (targetYearM < txYear) return false;
        if (targetYearM === txYear && targetMonthM < txMonth) return false;

        // Occurs every month (or more frequently)
        return true;
    }
  }

  /**
   * Convert transaction amount to monthly equivalent
   */
  private getTransactionMonthlyAmount(transaction: any): number {
    const amount = Math.abs(transaction.amount);

    switch (transaction.recurringType) {
      case "daily":
        return amount * 30;
      case "weekly":
        return amount * 4.33;
      case "biweekly":
        return amount * 2.17;
      case "monthly":
        return amount;
      case "quarterly":
        return amount / 3;
      case "yearly":
        return amount / 12;
      default:
        return amount;
    }
  }

  /**
   * Get the actual amount for a transaction in a specific month
   * (not averaged - use full amount when it occurs)
   */
  private getTransactionAmountForMonth(transaction: any): number {
    const amount = Math.abs(transaction.amount);

    switch (transaction.recurringType) {
      case "yearly":
      case "quarterly":
      case "monthly":
        // Use full amount when it actually occurs
        return amount;
      case "weekly":
        // Weekly = ~4.33 times per month
        return amount * 4.33;
      case "biweekly":
        // Biweekly = ~2.17 times per month
        return amount * 2.17;
      case "daily":
        // Daily = ~30 times per month
        return amount * 30;
      default:
        return amount;
    }
  }
}
