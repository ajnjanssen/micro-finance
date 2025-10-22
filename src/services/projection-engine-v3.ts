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
   * Generate projections for N months based on configuration
   */
  async generateProjections(months: number): Promise<MonthlyProjection[]> {
    const config = await this.configService.loadConfig();
    const data = await this.dataService.loadData();
    const projections: MonthlyProjection[] = [];

    // Get current balance
    let balance =
      config.startingBalance.checking + config.startingBalance.savings;

    // Calculate balance up to today from historical transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const historicalTransactions = data.transactions.filter((t) => {
      const txDate = new Date(t.date);
      return txDate <= today && !t.description.includes("Starting Balance");
    });

    const historicalBalance = historicalTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    const currentBalance =
      config.startingBalance.checking +
      config.startingBalance.savings +
      historicalBalance;

    balance = currentBalance;

    // Generate projections
    for (let i = 0; i < months; i++) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + i);
      targetDate.setDate(1); // First of month
      const monthStr = targetDate.toISOString().substring(0, 7); // YYYY-MM

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

      // Calculate actual income/expenses from historical data (for comparison)
      let actualIncome = 0;
      let actualExpenses = 0;

      if (targetDate <= today) {
        const monthTransactions = data.transactions.filter((t) => {
          const txDate = new Date(t.date);
          return (
            txDate.getFullYear() === targetDate.getFullYear() &&
            txDate.getMonth() === targetDate.getMonth() &&
            !t.description.includes("Starting Balance")
          );
        });

        actualIncome = monthTransactions
          .filter((t) => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);

        actualExpenses = Math.abs(
          monthTransactions
            .filter((t) => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0)
        );
      }

      // Update balance
      const netChange = configuredIncome - configuredExpenses;
      balance += netChange;

      // Create projection
      const projection: MonthlyProjection = {
        month: monthStr,
        configuredIncome,
        actualIncome,
        configuredExpenses,
        actualExpenses,
        projectedBalance: balance,
        actualBalance: targetDate <= today ? currentBalance : undefined,
        incomeBreakdown,
        expenseBreakdown,
        confidence: 100, // We know exactly what's configured
        incomeVariance:
          targetDate <= today ? actualIncome - configuredIncome : undefined,
        expenseVariance:
          targetDate <= today ? actualExpenses - configuredExpenses : undefined,
      };

      projections.push(projection);

      // Update currentBalance for next iteration if past month
      if (targetDate <= today) {
        const monthTransactions = data.transactions.filter((t) => {
          const txDate = new Date(t.date);
          return (
            txDate.getFullYear() === targetDate.getFullYear() &&
            txDate.getMonth() === targetDate.getMonth()
          );
        });
        const monthChange = monthTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );
        balance = currentBalance + monthChange;
      }
    }

    return projections;
  }

  /**
   * Get summary of current month
   */
  async getCurrentMonthSummary() {
    const config = await this.configService.loadConfig();
    const data = await this.dataService.loadData();
    const today = new Date();

    // Configured for this month
    const configuredIncome = config.incomeSources
      .filter((s) => s.isActive && occursInMonth(s, today))
      .reduce((sum, s) => sum + convertToMonthly(s.amount, s.frequency), 0);

    const configuredExpenses = config.recurringExpenses
      .filter((e) => e.isActive && occursInMonth(e, today))
      .reduce((sum, e) => sum + convertToMonthly(e.amount, e.frequency), 0);

    // Actual so far this month
    const thisMonthTransactions = data.transactions.filter((t) => {
      const txDate = new Date(t.date);
      return (
        txDate.getFullYear() === today.getFullYear() &&
        txDate.getMonth() === today.getMonth() &&
        !t.description.includes("Starting Balance")
      );
    });

    const actualIncome = thisMonthTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const actualExpenses = Math.abs(
      thisMonthTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    return {
      configuredIncome,
      actualIncome,
      remainingIncome: configuredIncome - actualIncome,

      configuredExpenses,
      actualExpenses,
      remainingExpenses: configuredExpenses - actualExpenses,

      configuredNet: configuredIncome - configuredExpenses,
      actualNet: actualIncome - actualExpenses,

      daysInMonth: new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).getDate(),
      daysElapsed: today.getDate(),
    };
  }
}
