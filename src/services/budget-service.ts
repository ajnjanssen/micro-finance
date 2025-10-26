/**
 * Budget Service
 * Handles all budget-related calculations: 50/30/20 rule, expense categorization, budget recommendations
 * All components MUST use this service - NO budget logic in components
 */

import {
  BUDGET_PERCENTAGES,
  BUDGET_TYPES,
  BUDGET_CATEGORIES,
  FREQUENCY_TO_MONTHLY,
  VARIABLE_CATEGORIES,
  type BudgetCategory,
  type BudgetType,
  type Frequency,
} from "@/constants/categories";
import { CategoryService } from "./category-service";
import { TransactionService } from "./transaction-service";
import type { Transaction } from "@/types/finance";
import type { RecurringExpense } from "@/types/financial-config";

export interface BudgetBreakdown {
  needs: {
    budgeted: number;
    spent: number;
    items: Array<{ name: string; amount: number; category: string }>;
  };
  wants: {
    budgeted: number;
    spent: number;
    items: Array<{ name: string; amount: number; category: string }>;
  };
  savings: {
    budgeted: number;
    spent: number;
    items: Array<{ name: string; amount: number; category: string }>;
  };
  totalIncome: number;
}

export interface CategoryBudget {
  category: string;
  budgeted: number;
  spent: number;
  recommended: number;
  description: string;
  type: "fixed" | "variable";
  isRecurring: boolean;
}

export class BudgetService {
  private static instance: BudgetService;
  private categoryService: CategoryService;
  private transactionService: TransactionService;

  private constructor() {
    this.categoryService = CategoryService.getInstance();
    this.transactionService = TransactionService.getInstance();
  }

  static getInstance(): BudgetService {
    if (!BudgetService.instance) {
      BudgetService.instance = new BudgetService();
    }
    return BudgetService.instance;
  }

  /**
   * Calculate 50/30/20 budget targets
   *
   * @param totalIncome - Monthly income
   * @param customPercentages - Optional custom percentages (defaults to 50/30/20)
   * @returns Budget targets for needs/wants/savings
   */
  calculate503020Targets(
    totalIncome: number,
    customPercentages?: { needs: number; wants: number; savings: number }
  ): {
    needs: number;
    wants: number;
    savings: number;
  } {
    const percentages = customPercentages || {
      needs: BUDGET_PERCENTAGES.NEEDS,
      wants: BUDGET_PERCENTAGES.WANTS,
      savings: BUDGET_PERCENTAGES.SAVINGS,
    };

    return {
      needs: totalIncome * percentages.needs,
      wants: totalIncome * percentages.wants,
      savings: totalIncome * percentages.savings,
    };
  }

  /**
   * Convert frequency-based amount to monthly amount
   *
   * @param amount - Amount at given frequency
   * @param frequency - Frequency (monthly, quarterly, yearly, etc.)
   * @returns Monthly amount
   */
  convertToMonthly(amount: number, frequency: Frequency): number {
    const multiplier = FREQUENCY_TO_MONTHLY[frequency] || 1;
    return amount * multiplier;
  }

  /**
   * Categorize configured expense into budget type
   *
   * @param expense - Configured expense
   * @returns Budget type (needs/wants/savings)
   */
  categorizeExpense(expense: RecurringExpense): BudgetType {
    // If explicitly set, use that
    if (expense.budgetType) {
      return expense.budgetType;
    }

    // Force groceries to wants (user preference)
    if (this.categoryService.isGroceryItem(expense.name)) {
      return BUDGET_TYPES.WANTS;
    }

    // Use category-based classification
    return this.categoryService.getBudgetType(expense.category);
  }

  /**
   * Calculate if a configured expense should be included in a specific month
   *
   * @param expense - Configured expense
   * @param monthEndDate - End date of the month to check
   * @returns True if expense is active in this month
   */
  isExpenseActiveInMonth(
    expense: RecurringExpense,
    monthEndDate: Date
  ): boolean {
    if (!expense.isActive) return false;

    const expenseStart = new Date(expense.startDate);
    if (expenseStart > monthEndDate) return false;

    if (expense.endDate) {
      const expenseEnd = new Date(expense.endDate);
      if (expenseEnd < monthEndDate) return false;
    }

    return true;
  }

  /**
   * Calculate full budget breakdown with 50/30/20 categorization
   * Includes configured expenses, recurring transactions, and savings goals
   *
   * @param totalIncome - Monthly income
   * @param configuredExpenses - Configured recurring expenses
   * @param transactions - All transactions
   * @param savingsGoals - Active savings goals
   * @param monthEndDate - End date of month (to check if expenses have started)
   * @param customPercentages - Optional custom budget percentages
   * @returns Complete budget breakdown
   */
  calculateBudgetBreakdown(
    totalIncome: number,
    configuredExpenses: RecurringExpense[],
    transactions: Transaction[],
    savingsGoals: any[], // TODO: Type this properly
    monthEndDate: Date,
    customPercentages?: { needs: number; wants: number; savings: number }
  ): BudgetBreakdown {
    const targets = this.calculate503020Targets(totalIncome, customPercentages);

    const needs: Array<{ name: string; amount: number; category: string }> = [];
    const wants: Array<{ name: string; amount: number; category: string }> = [];
    const savings: Array<{ name: string; amount: number; category: string }> =
      [];

    // Process configured expenses
    for (const expense of configuredExpenses) {
      if (!this.isExpenseActiveInMonth(expense, monthEndDate)) continue;

      // Force groceries to wants
      if (this.categoryService.isGroceryItem(expense.name)) {
        wants.push({
          name: expense.name,
          amount: this.convertToMonthly(expense.amount, expense.frequency),
          category: expense.category,
        });
        continue;
      }

      const budgetType = this.categorizeExpense(expense);
      const monthlyAmount = this.convertToMonthly(
        expense.amount,
        expense.frequency
      );
      const item = {
        name: expense.name,
        amount: monthlyAmount,
        category: expense.category,
      };

      if (budgetType === BUDGET_TYPES.NEEDS) {
        needs.push(item);
      } else if (budgetType === BUDGET_TYPES.WANTS) {
        wants.push(item);
      } else {
        savings.push(item);
      }
    }

    // Process recurring expense transactions (excluding savings transactions and groceries already in config)
    const recurringExpenses = this.transactionService.filterRecurring(
      this.transactionService.filterNonSavingsTransactions(
        this.transactionService.filterByType(transactions, "expense")
      )
    );

    for (const transaction of recurringExpenses) {
      const category = this.categoryService.normalizeCategory(
        transaction.category
      );
      const txAmount = Math.abs(transaction.amount);
      const item = {
        name: transaction.description,
        amount: txAmount,
        category: transaction.category || "Onbekend",
      };

      // Check if savings-related by category
      if (
        category.includes("spar") ||
        category.includes("saving") ||
        category.includes("besparing")
      ) {
        savings.push(item);
      }
      // Force groceries to wants
      else if (this.categoryService.isGroceryItem(transaction.description)) {
        wants.push(item);
      }
      // Use category-based classification
      else {
        const budgetType = this.categoryService.getBudgetType(category);
        if (budgetType === BUDGET_TYPES.NEEDS) {
          needs.push(item);
        } else if (budgetType === BUDGET_TYPES.WANTS) {
          wants.push(item);
        } else {
          savings.push(item);
        }
      }
    }

    // Add savings goals
    const goalItems = savingsGoals
      .filter(
        (goal: any) => goal.monthlyContribution && goal.monthlyContribution > 0
      )
      .map((goal: any) => ({
        name: goal.name,
        amount: goal.monthlyContribution,
        category: "Spaardoel",
      }));

    savings.push(...goalItems);

    // Calculate totals
    const needsTotal = needs.reduce((sum, item) => sum + item.amount, 0);
    const wantsTotal = wants.reduce((sum, item) => sum + item.amount, 0);
    const savingsTotal = savings.reduce((sum, item) => sum + item.amount, 0);

    return {
      needs: {
        budgeted: targets.needs,
        spent: needsTotal,
        items: needs,
      },
      wants: {
        budgeted: targets.wants,
        spent: wantsTotal,
        items: wants,
      },
      savings: {
        budgeted: targets.savings,
        spent: savingsTotal,
        items: savings,
      },
      totalIncome,
    };
  }

  /**
   * Calculate category-level budgets (for BudgetPlanner component)
   * Returns budgets for groceries, transport, food, entertainment, etc.
   *
   * @param totalIncome - Monthly income
   * @param configuredExpenses - Configured recurring expenses
   * @param transactions - All transactions
   * @param monthEndDate - End date of month
   * @param spentByBudgetCategory - Optional pre-calculated spending by budget category
   * @returns Array of category budgets
   */
  calculateCategoryBudgets(
    totalIncome: number,
    configuredExpenses: RecurringExpense[],
    transactions: Transaction[],
    monthEndDate: Date,
    spentByBudgetCategory?: Map<string, number>
  ): CategoryBudget[] {
    // Calculate spent by category from transactions
    const monthExpenses = this.transactionService.getMonthExpenses(
      transactions,
      monthEndDate.getFullYear(),
      monthEndDate.getMonth() + 1
    );

    const spentByCategory = spentByBudgetCategory || new Map<string, number>();

    // Only calculate if not provided (for backwards compatibility)
    if (!spentByBudgetCategory) {
      for (const transaction of monthExpenses) {
        const category = this.categoryService.normalizeCategory(
          transaction.category
        );
        const current = spentByCategory.get(category) || 0;
        spentByCategory.set(category, current + Math.abs(transaction.amount));
      }
    }

    // Add configured expenses to spent (these are guaranteed to happen)
    const configuredByCategory = new Map<string, number>();
    for (const expense of configuredExpenses) {
      if (!this.isExpenseActiveInMonth(expense, monthEndDate)) continue;

      const category = this.categoryService.normalizeCategory(expense.category);

      // Only track variable categories in configured amounts
      if (VARIABLE_CATEGORIES.includes(category as BudgetCategory)) {
        const monthlyAmount = this.convertToMonthly(
          expense.amount,
          expense.frequency
        );
        const current = configuredByCategory.get(category) || 0;
        configuredByCategory.set(category, current + monthlyAmount);

        // Also add to spent (configured expenses will happen)
        const spent = spentByCategory.get(category) || 0;
        spentByCategory.set(category, spent + monthlyAmount);
      }
    }

    // Calculate housing and insurance from configured expenses
    const housingTotal = this.calculateCategoryTotal(
      configuredExpenses,
      BUDGET_CATEGORIES.HOUSING,
      monthEndDate
    );
    const insuranceTotal = this.calculateCategoryTotal(
      configuredExpenses,
      BUDGET_CATEGORIES.INSURANCE,
      monthEndDate
    );

    if (housingTotal > 0) {
      spentByCategory.set(BUDGET_CATEGORIES.HOUSING, housingTotal);
      configuredByCategory.set(BUDGET_CATEGORIES.HOUSING, housingTotal);
    }
    if (insuranceTotal > 0) {
      spentByCategory.set(BUDGET_CATEGORIES.INSURANCE, insuranceTotal);
      configuredByCategory.set(BUDGET_CATEGORIES.INSURANCE, insuranceTotal);
    }

    // Get average spending for recommendations
    const avgSpending =
      this.transactionService.calculateAverageMonthlySpending(transactions);

    // Build category budgets
    const targets = this.calculate503020Targets(totalIncome);
    const essentialBudget = targets.needs;
    const discretionaryBudget = targets.wants;
    const bufferBudget = targets.savings;

    const categoryDefinitions: Record<
      string,
      { recommended: number; description: string; type: "fixed" | "variable" }
    > = {
      [BUDGET_CATEGORIES.HOUSING]: {
        recommended: housingTotal > 0 ? housingTotal : essentialBudget * 0.55,
        description: "Huur, energie, internet, telefoon",
        type: "fixed",
      },
      [BUDGET_CATEGORIES.INSURANCE]: {
        recommended:
          insuranceTotal > 0 ? insuranceTotal : essentialBudget * 0.25,
        description: "Zorg, auto, aansprakelijkheid",
        type: "fixed",
      },
      [BUDGET_CATEGORIES.TRANSPORT]: {
        recommended: 120,
        description: "Benzine, OV, parkeren (alleen regelmatige kosten)",
        type: "variable",
      },
      [BUDGET_CATEGORIES.GROCERIES]: {
        recommended: essentialBudget * 0.15,
        description: "Boodschappen en huishoudelijke artikelen",
        type: "variable",
      },
      [BUDGET_CATEGORIES.FOOD]: {
        recommended: discretionaryBudget * 0.35,
        description: "Restaurants en takeaway",
        type: "variable",
      },
      [BUDGET_CATEGORIES.ENTERTAINMENT]: {
        recommended: discretionaryBudget * 0.35,
        description: "Streaming, uitgaan, hobby's",
        type: "variable",
      },
      [BUDGET_CATEGORIES.SHOPPING]: {
        recommended: discretionaryBudget * 0.25,
        description: "Kleding, elektronica, persoonlijke verzorging",
        type: "variable",
      },
      [BUDGET_CATEGORIES.VACATION]: {
        recommended: bufferBudget * 0.5,
        description: "Vakanties en reizen (sparen per maand)",
        type: "variable",
      },
    };

    return Object.entries(categoryDefinitions).map(([category, config]) => {
      const spent = spentByCategory.get(category) || 0;
      const avgSpent = avgSpending.get(category) || 0;
      const configured = configuredByCategory.get(category) || 0;

      // Priority: configured > average > recommended
      const budgeted =
        configured > 0 ? configured : Math.max(avgSpent, config.recommended);

      return {
        category,
        budgeted: Math.round(budgeted * 100) / 100,
        spent: Math.round(spent * 100) / 100,
        recommended: Math.round(config.recommended * 100) / 100,
        description: config.description,
        type: config.type,
        isRecurring: config.type === "fixed",
      };
    });
  }

  /**
   * Helper: Calculate total for a specific category from configured expenses
   */
  private calculateCategoryTotal(
    expenses: RecurringExpense[],
    targetCategory: string,
    monthEndDate: Date
  ): number {
    return expenses
      .filter((e) => {
        if (!this.isExpenseActiveInMonth(e, monthEndDate)) return false;
        const normalized = this.categoryService.normalizeCategory(e.category);
        return normalized === targetCategory;
      })
      .reduce((sum, e) => {
        return sum + this.convertToMonthly(e.amount, e.frequency);
      }, 0);
  }
}
