/**
 * Budget-related TypeScript interfaces
 * Max 50 lines per NASA coding standard
 */

export interface BudgetBreakdown {
  needs: BudgetSection;
  wants: BudgetSection;
  savings: BudgetSection;
  totalIncome: number;
}

export interface BudgetSection {
  budgeted: number;
  spent: number;
  items: BudgetItem[];
}

export interface BudgetItem {
  name: string;
  amount: number;
  category: string;
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

export interface Budget503020Targets {
  needs: number;
  wants: number;
  savings: number;
}

export interface MonthlyBudgetSummary {
  monthlyIncome: number;
  savingsGoal: number;
  studentDebt: number;
  availableForSpending: number;
  totalSpent: number;
}
