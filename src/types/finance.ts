export interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "crypto" | "stocks" | "debt" | "other";
  balance?: number; // Optional - will be calculated from transactions
  description?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  categoryReason?: string; // Audit trail: why was this category assigned?
  accountId: string;
  date: string;
  isRecurring: boolean;
  recurringType?: "monthly" | "yearly" | "weekly" | "daily";
  recurringEndDate?: string;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
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
