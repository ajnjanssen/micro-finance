/**
 * Expense Categorizer - Budget Type Classification
 * Max 50 lines per NASA standard
 */

import { BUDGET_TYPES, type BudgetType } from "@/constants/categories";
import { CategoryService } from "../category-service";
import type { RecurringExpense } from "@/types/financial-config";

export class ExpenseCategorizer {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = CategoryService.getInstance();
  }

  /**
   * Categorize expense into needs/wants/savings
   * @param expense - Configured expense
   * @returns Budget type classification
   */
  categorize(expense: RecurringExpense): BudgetType {
    // If explicitly set, use that
    if (expense.budgetType) {
      return expense.budgetType;
    }

    // Use category-based classification
    return this.categoryService.getBudgetType(expense.category);
  }

  /**
   * Check if expense is active in a specific month
   * @param expense - Configured expense
   * @param monthEndDate - End date of month
   * @returns True if active
   */
  isActiveInMonth(expense: RecurringExpense, monthEndDate: Date): boolean {
    if (!expense.isActive) return false;

    const expenseStart = new Date(expense.startDate);
    if (expenseStart > monthEndDate) return false;

    if (expense.endDate) {
      const expenseEnd = new Date(expense.endDate);
      if (expenseEnd < monthEndDate) return false;
    }

    return true;
  }
}
