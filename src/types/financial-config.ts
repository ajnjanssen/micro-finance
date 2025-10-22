/**
 * Financial Configuration Types
 *
 * This is the SOURCE OF TRUTH for projections.
 * NOT derived from transactions - manually configured by user.
 */

export type Frequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export interface IncomeSource {
  id: string;
  name: string; // e.g., "Salary - EXACT CLOUD"
  amount: number; // Monthly amount (converted if different frequency)
  frequency: Frequency;
  dayOfMonth?: number; // e.g., 23 for salary on 23rd
  startDate: string; // YYYY-MM-DD
  endDate?: string; // Optional - for temporary income
  isActive: boolean;
  notes?: string;
  category:
    | "salary"
    | "freelance"
    | "investment"
    | "rental"
    | "business"
    | "other";
}

export interface RecurringExpense {
  id: string;
  name: string; // e.g., "Rent - Patrimonium"
  category: string; // From existing TransactionCategory
  amount: number; // Monthly amount
  frequency: Frequency;
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  isEssential: boolean; // Can't be reduced (rent, insurance)
  isVariable: boolean; // Amount varies month-to-month (utilities)
  estimatedVariance?: number; // ±% for variable expenses
  notes?: string;
}

export interface OneTimeExpense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  isPaid: boolean;
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // YYYY-MM-DD
  monthlyContribution?: number;
  priority: "low" | "medium" | "high";
  isActive: boolean;
}

export interface StartingBalance {
  date: string; // YYYY-MM-DD - reference date
  checking: number;
  savings: number;
  other?: { [accountId: string]: number };
}

/**
 * Main Configuration Object
 */
export interface FinancialConfiguration {
  version: string; // "3.0"
  lastUpdated: string; // ISO timestamp

  // Reference point
  startingBalance: StartingBalance;

  // Income
  incomeSources: IncomeSource[];

  // Expenses
  recurringExpenses: RecurringExpense[];
  oneTimeExpenses: OneTimeExpense[];

  // Goals
  savingsGoals: SavingsGoal[];

  // Settings
  settings: {
    defaultCurrency: "EUR" | "USD" | "GBP";
    projectionMonths: number; // How many months to project forward
    conservativeMode: boolean; // Use pessimistic estimates
  };
}

/**
 * Projection Result (calculated from configuration)
 */
export interface MonthlyProjection {
  month: string; // YYYY-MM

  // Income
  configuredIncome: number;
  actualIncome: number; // From transactions (for comparison)

  // Expenses
  configuredExpenses: number;
  actualExpenses: number; // From transactions

  // Balance
  projectedBalance: number;
  actualBalance?: number; // If month is in past

  // Breakdown
  incomeBreakdown: { source: string; amount: number }[];
  expenseBreakdown: { name: string; amount: number }[];

  // Confidence
  confidence: number; // 100 for configured items

  // Variance (actual vs configured)
  incomeVariance?: number;
  expenseVariance?: number;
}

/**
 * Budget vs Actual Analysis
 */
export interface BudgetAnalysis {
  month: string;

  // Overall
  budgetedIncome: number;
  actualIncome: number;
  incomeVariance: number; // actual - budgeted

  budgetedExpenses: number;
  actualExpenses: number;
  expenseVariance: number;

  // By category
  categoryAnalysis: {
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
    percentVariance: number;
  }[];

  // Unbudgeted spending
  unbudgetedExpenses: {
    description: string;
    amount: number;
    category: string;
    date: string;
  }[];

  // Alerts
  alerts: {
    type: "overspending" | "under-income" | "missed-payment";
    message: string;
    amount?: number;
  }[];
}

/**
 * Helper functions
 */

export function convertToMonthly(amount: number, frequency: Frequency): number {
  switch (frequency) {
    case "weekly":
      return amount * 4.33; // Average weeks per month
    case "biweekly":
      return amount * 2.17;
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "yearly":
      return amount / 12;
  }
}

export function occursInMonth(
  item: { frequency: Frequency; startDate: string; endDate?: string },
  targetMonth: Date
): boolean {
  const start = new Date(item.startDate);
  const end = item.endDate ? new Date(item.endDate) : null;

  // Check if target month is within date range
  if (targetMonth < start) return false;
  if (end && targetMonth > end) return false;

  // For now, all active items occur every month
  // (can refine for weekly/quarterly later)
  return true;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
