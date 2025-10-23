/**
 * Budget Calculator - 50/30/20 Rule
 * Max 50 lines per NASA standard
 */

import { BUDGET_PERCENTAGES } from "@/constants/categories";
import type { Budget503020Targets } from "@/types/budget.types";

export class BudgetCalculator {
  /**
   * Calculate 50/30/20 budget targets from total income
   * @param totalIncome - Monthly income
   * @returns Budget targets for needs, wants, savings
   */
  calculate503020Targets(totalIncome: number): Budget503020Targets {
    return {
      needs: totalIncome * BUDGET_PERCENTAGES.NEEDS,
      wants: totalIncome * BUDGET_PERCENTAGES.WANTS,
      savings: totalIncome * BUDGET_PERCENTAGES.SAVINGS,
    };
  }

  /**
   * Convert any frequency to monthly amount
   * @param amount - Amount to convert
   * @param frequency - Frequency type
   * @returns Monthly amount
   */
  convertToMonthly(amount: number, frequency: string): number {
    const multipliers: Record<string, number> = {
      monthly: 1,
      quarterly: 1 / 3,
      yearly: 1 / 12,
    };
    
    return amount * (multipliers[frequency] || 1);
  }

  /**
   * Calculate total from category budget map
   * @param categoryMap - Map of category to amount
   * @returns Total amount
   */
  calculateTotal(categoryMap: Map<string, number>): number {
    return Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
  }
}
