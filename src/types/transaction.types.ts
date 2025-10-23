/**
 * Transaction-related TypeScript interfaces
 * Max 50 lines per NASA coding standard
 */

export interface TransactionFilters {
  type?: "income" | "expense" | "all";
  category?: string;
  dateRange?: DateRange;
  isRecurring?: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TransactionAggregate {
  category: string;
  total: number;
  count: number;
  transactions: string[]; // IDs
}

export interface MonthlySpending {
  month: string;
  total: number;
  byCategory: Record<string, number>;
}

export interface UnmappedCategory {
  category: string;
  count: number;
  totalAmount: number;
  examples: string[];
  suggestions: string[];
}
