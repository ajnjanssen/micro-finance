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
import { CategoryService } from "./category-service";
import { promises as fs } from "fs";
import path from "path";

export class ProjectionEngine {
  private configService: FinancialConfigService;
  private dataService: FinancialDataService;
  private categoryService: CategoryService;
  private readonly GOALS_FILE = path.join(
    process.cwd(),
    "data",
    "savings-goals.json"
  );

  constructor() {
    this.configService = FinancialConfigService.getInstance();
    this.dataService = FinancialDataService.getInstance();
    this.categoryService = CategoryService.getInstance();
  }

  private async loadSavingsGoals() {
    try {
      const data = await fs.readFile(this.GOALS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? { goals: parsed } : parsed;
    } catch {
      return { goals: [] };
    }
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

    // Initialize account balances
    const accountBalances: { [accountId: string]: number } = {};
    for (const account of data.accounts) {
      accountBalances[account.id] = account.startingBalance || 0;
    }
    
    // Track cumulative savings per goal for projection
    const goalSavingsAccumulated: { [goalId: string]: number } = {};
    // Track which goals have been spent in the projection (to avoid spending multiple times)
    const goalSpentInProjection: { [goalId: string]: boolean } = {};

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
      const incomeBreakdown: { source: string; amount: number; accountId?: string }[] = [];
      let configuredIncome = 0;

      for (const source of config.incomeSources.filter((s) => s.isActive)) {
        if (occursInMonth(source, targetDate)) {
          const amount = convertToMonthly(source.amount, source.frequency);
          incomeBreakdown.push({ 
            source: source.name, 
            amount,
            accountId: source.accountId 
          });
          configuredIncome += amount;
        }
      }

      // Add recurring income transactions (exclude transfers)
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
          incomeBreakdown.push({ 
            source: transaction.description, 
            amount,
            accountId: transaction.accountId 
          });
          configuredIncome += amount;
        }
      }

      // Calculate configured expenses for this month
      const expenseBreakdown: { name: string; amount: number; accountId?: string }[] = [];
      let configuredExpenses = 0;

      for (const expense of config.recurringExpenses.filter(
        (e) => e.isActive
      )) {
        if (occursInMonth(expense, targetDate)) {
          const amount = convertToMonthly(expense.amount, expense.frequency);
          expenseBreakdown.push({ 
            name: expense.name, 
            amount,
            accountId: expense.accountId 
          });
          configuredExpenses += amount;
        }
      }

      // Add active savings goals - these don't reduce total balance, just move money
      const savingsBreakdown: { name: string; amount: number; accountId?: string; goalId?: string }[] = [];
      const goalsData = await this.loadSavingsGoals();
      
      if (i <= 15) {
        console.log(`[ProjectionEngine] ${monthStr}: Total goals: ${goalsData.goals?.length || 0}`);
      }
      
      const activeGoals = (goalsData.goals || []).filter(
        (goal: any) => {
          // Must have monthly contribution
          if (!goal.monthlyContribution || goal.monthlyContribution <= 0) {
            if (i <= 15) console.log(`  Goal "${goal.name}": SKIP - no monthly contribution`);
            return false;
          }
          
          // Must not be spent yet
          if (goal.spentDate) {
            if (i <= 15) console.log(`  Goal "${goal.name}": SKIP - already spent`);
            return false;
          }
          
          // Initialize accumulated savings if not set
          if (goalSavingsAccumulated[goal.id] === undefined) {
            goalSavingsAccumulated[goal.id] = 0;
          }
          
          // Stop saving if goal is reached (based on accumulated projections)
          if (goalSavingsAccumulated[goal.id] >= goal.targetAmount) {
            if (i <= 15) console.log(`  Goal "${goal.name}": SKIP - already reached (${goalSavingsAccumulated[goal.id]} >= ${goal.targetAmount})`);
            return false;
          }
          
          // Check if within active date range
          if (goal.startDate) {
            const startDate = new Date(goal.startDate);
            if (targetDate < startDate) {
              if (i <= 15) console.log(`  Goal "${goal.name}": SKIP - not started yet (${targetDate.toISOString().slice(0,10)} < ${goal.startDate})`);
              return false; // Haven't started yet
            }
          }
          
          if (goal.endDate) {
            const endDate = new Date(goal.endDate);
            // Allow saving through the end date (inclusive), stop after
            const endOfMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
            if (targetDate > endOfMonth) {
              if (i <= 15) console.log(`  Goal "${goal.name}": SKIP - already ended (${targetDate.toISOString().slice(0,10)} > ${goal.endDate})`);
              return false; // Already ended
            }
          }
          
          if (i <= 15) console.log(`  Goal "${goal.name}": ACTIVE ✓`);
          return true;
        }
      );

      for (const goal of activeGoals) {
        savingsBreakdown.push({
          name: goal.name,
          amount: goal.monthlyContribution,
          accountId: goal.accountId,
          goalId: goal.id,
        });
        // Track accumulated savings for this goal
        goalSavingsAccumulated[goal.id] = (goalSavingsAccumulated[goal.id] || 0) + goal.monthlyContribution;
        // Note: We DON'T add this to configuredExpenses since it doesn't leave your total wealth
      }

      // Check if any goals were completed this month and should be spent
      const completedGoalsThisMonth: any[] = [];
      for (const goal of goalsData.goals || []) {
        // Skip if already spent (in data or in this projection)
        if (goal.spentDate || goalSpentInProjection[goal.id]) continue;
        
        if (goalSavingsAccumulated[goal.id] >= goal.targetAmount) {
          // Goal just reached! Add it to completed list
          const previousAccumulated = goalSavingsAccumulated[goal.id] - (goal.monthlyContribution || 0);
          if (previousAccumulated < goal.targetAmount) {
            // This is the month it was completed
            console.log(`[ProjectionEngine] ${monthStr}: Goal "${goal.name}" will be completed!`);
            console.log(`  Target: €${goal.targetAmount}, Accumulated: €${goalSavingsAccumulated[goal.id]}`);
            completedGoalsThisMonth.push(goal);
            // Mark as spent in this projection
            goalSpentInProjection[goal.id] = true;
          }
        }
      }

      // Add RECURRING expenses for this month
      for (const transaction of recurringTransactions.filter(
        (t) => t.type === "expense"
      )) {
        if (this.transactionOccursInMonth(transaction, targetDate)) {
          // Skip savings transactions - they're now handled by savings goals
          if (
            this.categoryService.isSavingsTransaction(transaction.description)
          ) {
            console.log(
              `[ProjectionEngine] Skipping duplicate savings transaction: ${transaction.description}`
            );
            continue;
          }

          const amount = Math.abs(
            this.getTransactionAmountForMonth(transaction)
          );
          expenseBreakdown.push({ 
            name: transaction.description, 
            amount,
            accountId: transaction.accountId 
          });
          configuredExpenses += amount;
        }
      }

      // Add ONE-TIME expense transactions for this month
      const oneTimeExpenses = data.transactions.filter(
        (t) => t.type === "expense" && !t.isRecurring && !t.completed
      );
      for (const transaction of oneTimeExpenses) {
        const txDate = new Date(transaction.date);
        if (
          txDate.getFullYear() === targetDate.getFullYear() &&
          txDate.getMonth() === targetDate.getMonth()
        ) {
          const amount = Math.abs(transaction.amount);
          expenseBreakdown.push({ 
            name: transaction.description, 
            amount,
            accountId: transaction.accountId 
          });
          configuredExpenses += amount;
        }
      }

      // Add one-time expenses from config for this month
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

      // Update per-account balances
      const accountBalancesThisMonth = { ...accountBalances };
      
      // Default account IDs (first checking account for expenses, first account overall for income)
      const defaultExpenseAccountId = data.accounts.find(a => a.type === 'checking')?.id || data.accounts[0]?.id;
      const defaultIncomeAccountId = data.accounts.find(a => a.type === 'checking')?.id || data.accounts[0]?.id;
      
      // Apply income to accounts
      for (const income of incomeBreakdown) {
        const targetAccountId = income.accountId || defaultIncomeAccountId;
        if (targetAccountId && accountBalancesThisMonth[targetAccountId] !== undefined) {
          accountBalancesThisMonth[targetAccountId] += income.amount;
        }
      }
      
      // Apply expenses to accounts
      for (const expense of expenseBreakdown) {
        const targetAccountId = expense.accountId || defaultExpenseAccountId;
        if (targetAccountId && accountBalancesThisMonth[targetAccountId] !== undefined) {
          accountBalancesThisMonth[targetAccountId] -= expense.amount;
        }
      }

      // Apply savings transfers (from checking to savings account)
      if (savingsBreakdown.length > 0) {
        const checkingAccount = data.accounts.find(a => a.type === 'checking');
        const savingsAccount = data.accounts.find(a => a.type === 'savings');
        
        if (checkingAccount && savingsAccount) {
          const totalSavings = savingsBreakdown.reduce((sum, s) => sum + s.amount, 0);
          
          if (i <= 15) {
            console.log(`[ProjectionEngine] ${monthStr}: Applying savings transfers`);
            console.log(`  Savings account before: €${accountBalancesThisMonth[savingsAccount.id].toFixed(2)}`);
          }
          
          // Deduct from checking
          accountBalancesThisMonth[checkingAccount.id] -= totalSavings;
          // Add to savings
          accountBalancesThisMonth[savingsAccount.id] += totalSavings;
          
          if (i <= 15) {
            console.log(`  Transfer amount: €${totalSavings}`);
            console.log(`  Savings account after: €${accountBalancesThisMonth[savingsAccount.id].toFixed(2)}`);
          }
        }
      }

      // Apply recurring transfer transactions (money moving between accounts)
      // Skip transfers that are already handled by savings goals
      for (const transaction of recurringTransactions.filter(
        (t) => t.type === "transfer" && !(t as any).savingsGoalId
      )) {
        if (this.transactionOccursInMonth(transaction, targetDate)) {
          const fromAccountId = transaction.accountId;
          const toAccountId = (transaction as any).toAccountId;
          
          if (fromAccountId && toAccountId && 
              accountBalancesThisMonth[fromAccountId] !== undefined &&
              accountBalancesThisMonth[toAccountId] !== undefined) {
            // Deduct from source account
            accountBalancesThisMonth[fromAccountId] -= transaction.amount;
            // Add to destination account
            accountBalancesThisMonth[toAccountId] += transaction.amount;
          }
        }
      }

      // Spend completed savings goals this month (deduct from savings account)
      for (const completedGoal of completedGoalsThisMonth) {
        const savingsAccount = data.accounts.find(a => a.type === 'savings');
        if (savingsAccount && accountBalancesThisMonth[savingsAccount.id] !== undefined) {
          console.log(`[ProjectionEngine] ${monthStr}: Goal "${completedGoal.name}" reached! Spending €${completedGoal.targetAmount}`);
          console.log(`  Savings before: €${accountBalancesThisMonth[savingsAccount.id].toFixed(2)}`);
          
          // Deduct the goal amount from savings (you bought the item!)
          accountBalancesThisMonth[savingsAccount.id] -= completedGoal.targetAmount;
          // Also reduce total balance since money was spent
          balance -= completedGoal.targetAmount;
          
          console.log(`  Savings after: €${accountBalancesThisMonth[savingsAccount.id].toFixed(2)}`);
          
          // Add to expense breakdown for visibility, but DON'T add to configuredExpenses
          // because the money was already saved (didn't count as expense when transferred)
          expenseBreakdown.push({
            name: `🏍️ Gekocht: ${completedGoal.name}`,
            amount: completedGoal.targetAmount,
            accountId: savingsAccount.id,
          });
          // NOTE: We do NOT add to configuredExpenses - the money was already set aside
        }
      }

      // Update running account balances for next month
      Object.assign(accountBalances, accountBalancesThisMonth);

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
        accountBalances: accountBalancesThisMonth, // Add per-account balances
        incomeBreakdown,
        expenseBreakdown,
        savingsBreakdown, // Add savings as separate category
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

    console.log(
      `[getCurrentMonthSummary] Today: ${today.toISOString()}, Month: ${today.getMonth()}`
    );

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

    console.log(
      `[getCurrentMonthSummary] Total Income: ${totalConfiguredIncome} (configured: ${configuredIncome}, recurring: ${recurringIncome})`
    );

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
    if (transaction.recurringType === "yearly") {
      console.log(
        `[transactionOccursInMonth] Checking ${
          transaction.description
        }: txDateStr=${txDateStr}, txMonth=${txMonth}, targetMonth=${targetDate.getMonth()}`
      );
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
