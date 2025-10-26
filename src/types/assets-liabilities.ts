/**
 * Assets & Liabilities Types
 * Track net worth through debts, properties, investments, and other assets
 */

export type DebtType =
  | "student-loan"
  | "mortgage"
  | "credit-card"
  | "personal-loan"
  | "car-loan"
  | "other";

export type AssetType =
  | "property"
  | "vehicle"
  | "investment"
  | "savings"
  | "crypto"
  | "other";

export type PaymentFrequency =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "one-time";

export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  description?: string;

  // Amounts
  originalAmount: number;
  currentBalance: number;
  interestRate: number; // Annual percentage rate

  // Payment details
  monthlyPayment?: number;
  paymentFrequency?: PaymentFrequency;
  minimumPayment?: number;

  // Dates
  startDate: string; // ISO date
  endDate?: string; // ISO date - when debt will be paid off

  // Tracking
  isActive: boolean;
  lastUpdated: string; // ISO date

  // Optional
  creditor?: string;
  accountNumber?: string;
  notes?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  description?: string;

  // Valuation
  currentValue: number;
  purchasePrice?: number;
  purchaseDate?: string; // ISO date

  // For properties/vehicles
  appreciationRate?: number; // Annual percentage
  depreciationRate?: number; // Annual percentage for vehicles

  // Tracking
  isActive: boolean;
  lastUpdated: string; // ISO date

  // Optional
  location?: string;
  notes?: string;
}

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assets: Asset[];
  liabilities: Debt[];
}

export interface DebtPaymentSchedule {
  debtId: string;
  debtName: string;
  monthlyPayment: number;
  totalRemaining: number;
  payoffDate?: string;
  interestRate: number;
}
