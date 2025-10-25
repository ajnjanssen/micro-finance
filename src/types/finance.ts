export interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "crypto" | "stocks" | "debt" | "other";
  startingBalance: number; // Manual balance at startDate - NOT calculated from transactions
  startDate: string; // YYYY-MM-DD - when you started tracking this account
  description?: string;
  // Balance is always: startingBalance (no transaction calculations)
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  categoryReason?: string; // Audit trail: why was this category assigned?
  accountId: string;
  date: string;
  isRecurring: boolean;
  recurringType?: "monthly" | "yearly" | "weekly" | "daily";
  recurringEndDate?: string;
  tags?: string[];
  completed?: boolean; // Whether the transaction has actually occurred
  completedDate?: string; // When it was marked as completed
  toAccountId?: string; // For transfers: destination account
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer";
  color: string;
}

export interface FinancialData {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  lastUpdated: string;
}

export interface BalanceProjection {
  date: string;
  totalBalance: number;
  accountBalances: { [accountId: string]: number };
}

export interface MonthlyOverview {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  topCategories: { category: string; amount: number }[];
  // Breakdown for current month
  actualIncome?: number;
  actualExpenses?: number;
  projectedIncome?: number;
  projectedExpenses?: number;
}
