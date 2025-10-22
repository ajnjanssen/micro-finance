/**
 * Enhanced Financial Data Model v2.0
 *
 * Proof of Concept with:
 * - Confidence scoring
 * - Full configuration support
 * - Tax calculation
 * - Loan tracking
 * - What-if scenarios
 */

// ============= CORE ENTITIES =============

export interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "investment" | "credit-card";
  balance: number;
  currency: "EUR" | "USD";
  institution?: string;
  accountNumber?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // Signed: + income, - expense

  // Categorization
  category: TransactionCategory;
  subcategory?: string;
  autoCategorizationConfidence: number; // 0-100
  categorizationReason: string; // Audit trail
  manuallyReviewed: boolean;

  // Recurring detection
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  recurringGroupId?: string; // Links related recurring transactions
  recurringConfidence?: number; // 0-100

  // Metadata
  accountId: string;
  tags: string[];
  notes?: string;

  // Tax
  taxDeductible: boolean;
  taxCategory?: string;

  // Source tracking
  importSource: "csv" | "manual" | "api";
  importDate: string;
  importBatch?: string; // Group imports together
}

export type TransactionCategory =
  // Income
  | "salary"
  | "bonus"
  | "investment-income"
  | "rental-income"
  | "freelance-income"
  | "gift-income"
  | "other-income"
  // Housing
  | "rent"
  | "mortgage"
  | "utilities"
  | "home-maintenance"
  | "property-tax"
  // Food
  | "groceries"
  | "dining"
  | "coffee-snacks"
  // Transportation
  | "public-transport"
  | "fuel"
  | "car-maintenance"
  | "car-insurance"
  | "parking"
  // Health
  | "health-insurance"
  | "healthcare"
  | "pharmacy"
  | "fitness"
  // Personal
  | "shopping"
  | "personal-care"
  | "entertainment"
  | "hobbies"
  | "education"
  | "subscriptions"
  // Financial
  | "savings-transfer"
  | "investment-transfer"
  | "loan-payment"
  | "credit-card-payment"
  | "bank-fees"
  | "insurance-other"
  | "tax-payment"
  // Personal Transfers
  | "personal-transfer"
  | "loan-to-friend"
  | "loan-from-friend"
  // Other
  | "gifts-donations"
  | "travel"
  | "uncategorized";

export interface RecurringPattern {
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  expectedAmount: number;
  amountTolerance: number; // % variance allowed
  nextExpectedDate: string;
  lastOccurrence: string;
  occurrenceCount: number; // How many times detected
  confidence: number; // 0-100
}

// ============= CONFIGURATION =============

export interface IncomeSource {
  id: string;
  name: string;
  type:
    | "salary"
    | "freelance"
    | "investment"
    | "rental"
    | "business"
    | "pension"
    | "social-security"
    | "other";
  employer?: string;
  monthlyAmount: number; // Gross amount
  frequency: "monthly" | "biweekly" | "weekly";
  taxable: boolean;
  taxRate?: number; // Effective tax rate %
  startDate: string;
  endDate?: string; // null if ongoing
  confidence: "confirmed" | "estimated";
  linkedTransactionIds: string[]; // Historical salary payments
  notes?: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  category: TransactionCategory;
  monthlyAmount: number; // Normalized to monthly
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  dayOfMonth?: number; // For monthly (1-31)
  dayOfWeek?: number; // For weekly (0-6, Sunday=0)

  // Flexibility
  isEssential: boolean; // Rent, utilities = true; Entertainment = false
  canReduce: boolean;
  reductionPotential?: number; // % that could be reduced (0-100)

  // Tracking
  linkedTransactionIds: string[];
  lastPaidDate?: string;
  nextDueDate?: string;

  // Dates
  startDate: string;
  endDate?: string;

  // Metadata
  notes?: string;
  confidence: number; // 0-100, based on transaction history
}

export interface Loan {
  id: string;
  name: string;
  type: "mortgage" | "student" | "personal" | "auto" | "credit-card" | "other";
  lender: string;

  // Loan details
  originalAmount: number;
  currentBalance: number;
  interestRate: number; // Annual % (APR)
  termMonths: number;
  monthlyPayment: number;
  minimumPayment?: number; // For credit cards

  // Payment details
  paymentDay: number; // Day of month (1-31)
  nextPaymentDate: string;
  lastPaymentDate?: string;

  // Dates
  startDate: string;
  firstPaymentDate: string;
  maturityDate: string;

  // Status
  status: "active" | "paid-off" | "deferred" | "defaulted";

  // Tracking
  accountId?: string;
  linkedTransactionIds: string[];

  // Tax
  interestDeductible: boolean; // e.g., mortgage interest

  notes?: string;
}

export interface TaxConfiguration {
  id: string;
  country: "NL" | "US" | "UK" | "DE" | "FR"; // Expand as needed
  taxYear: number;

  // Personal info
  filingStatus: "single" | "married" | "married-separate" | "head-of-household";
  dependents: number;

  // Income tax (Netherlands example)
  incomeTaxBrackets: TaxBracket[];
  standardDeduction: number;

  // Dutch-specific (Boxes system)
  box1Rate?: number; // Income from work and home (progressive)
  box2Rate?: number; // Income from substantial interest (26.9%)
  box3Rate?: number; // Income from savings and investments (32%)

  // Social security
  socialSecurityRate: number; // e.g., 27.65% in NL
  socialSecurityMax?: number; // Max income subject to SS

  // Tax credits
  taxCredits: TaxCredit[];

  // Deductions
  mortgageInterestDeduction: boolean;
  mortgageInterestRate?: number; // % of interest deductible
  charitableDeductions: number;
  businessExpenses: number;
  studentLoanInterestDeduction: number;

  // Other
  estimatedQuarterlyPayments: number; // For self-employed

  notes?: string;
}

export interface TaxBracket {
  min: number;
  max: number | null; // null = no upper limit
  rate: number; // %
  description?: string;
}

export interface TaxCredit {
  name: string;
  amount: number;
  description: string;
  eligibilityNotes?: string;
}

// ============= PROJECTIONS =============

export interface FinancialProjection {
  month: string; // YYYY-MM
  date: string; // End of month date

  // Balances
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;

  // Cash flow
  expectedIncome: number; // Gross
  expectedTax: number;
  expectedExpenses: number;
  expectedLoanPayments: number;
  expectedNetCashFlow: number; // Income - Tax - Expenses - Loans

  // Breakdown
  accountBalances: { [accountId: string]: number };
  loanBalances: { [loanId: string]: number };

  // Income breakdown
  incomeBreakdown: {
    salary: number;
    investments: number;
    other: number;
  };

  // Expense breakdown
  expenseBreakdown: {
    housing: number;
    food: number;
    transport: number;
    healthcare: number;
    entertainment: number;
    other: number;
  };

  // Confidence & factors
  confidence: "high" | "medium" | "low";
  confidenceScore: number; // 0-100
  factors: ProjectionFactor[];
}

export interface ProjectionFactor {
  type: "income" | "expense" | "loan" | "tax" | "assumption";
  description: string;
  impact: "positive" | "negative" | "neutral";
  confidence: number; // 0-100
}

// ============= SCENARIOS =============

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  createdAt: string;

  // Changes
  changes: ScenarioChange[];

  // Results (calculated)
  baselineProjection?: FinancialProjection[];
  scenarioProjection?: FinancialProjection[];

  // Summary
  totalImpact?: number; // Net difference over scenario period
  monthlyImpact?: number; // Average monthly difference
  breakEvenMonth?: string; // When scenario pays off
  roi?: number; // Return on investment (%)

  // Analysis
  recommendation?: "recommended" | "consider" | "not-recommended";
  recommendationReason?: string;

  // Metadata
  projectionMonths: number; // How many months projected
}

export interface ScenarioChange {
  id: string;
  type:
    | "reduce-expense"
    | "eliminate-expense"
    | "add-income"
    | "reduce-income"
    | "pay-off-debt"
    | "increase-savings"
    | "new-expense"
    | "new-income";

  // Target
  targetId?: string; // RecurringExpense ID, Loan ID, IncomeSource ID, etc.
  targetName: string;
  targetCategory?: TransactionCategory;

  // Change details
  percentChange?: number; // e.g., -20 for 20% reduction
  fixedChange?: number; // e.g., +500 for €500 increase
  newValue?: number; // Absolute new value

  // Timing
  startMonth: string; // YYYY-MM
  endMonth?: string; // If temporary

  // Description
  description: string;
}

// ============= ANALYTICS =============

export interface FinancialInsight {
  id: string;
  type: "warning" | "opportunity" | "info" | "success";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: "spending" | "income" | "debt" | "savings" | "tax";
  actionable: boolean;
  suggestedAction?: string;
  priority: number; // 1-10, higher = more important
  createdAt: string;
}

export interface SpendingTrend {
  category: TransactionCategory;
  monthlyData: { month: string; amount: number }[];
  trend: "increasing" | "decreasing" | "stable" | "volatile";
  percentChange: number; // Over period
  average: number;
  max: number;
  min: number;
  standardDeviation: number;
  volatilityScore: number; // 0-100
}

export interface FinancialHealthScore {
  overall: number; // 0-100
  components: {
    cashFlow: number; // Positive vs negative
    debtToIncome: number; // Lower is better
    savingsRate: number; // Higher is better
    emergencyFund: number; // Months of expenses covered
    budgetAdherence: number; // Staying within budgets
  };
  grade: "excellent" | "good" | "fair" | "poor" | "critical";
  recommendations: string[];
}

// ============= IMPORT =============

export interface ImportResult {
  batchId: string;
  importDate: string;
  fileName: string;

  // Results
  transactions: Transaction[];

  // Summary
  totalRows: number;
  imported: number;
  skipped: number;
  needsReview: number;

  // Stats
  dateRange: { start: string; end: string };
  totalIncome: number;
  totalExpenses: number;

  // Categorization
  categoryBreakdown: { [category: string]: number };
  confidenceDistribution: {
    high: number; // 80-100%
    medium: number; // 50-79%
    low: number; // 0-49%
  };

  // Recurring detection
  recurringDetected: number;
  recurringConfirmed: number;

  // Configuration extracted
  detectedIncomeSources: IncomeSource[];
  detectedRecurringExpenses: RecurringExpense[];
  suggestedLoans: Loan[];

  // Issues
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface ImportWarning {
  type: "duplicate" | "unusual-amount" | "missing-data" | "low-confidence";
  message: string;
  transactionIds: string[];
}

// ============= MAIN DATA STORE =============

export interface FinancialDataV2 {
  version: "2.0";

  // Core
  accounts: Account[];
  transactions: Transaction[];

  // Configuration
  incomeSources: IncomeSource[];
  recurringExpenses: RecurringExpense[];
  loans: Loan[];
  taxConfig: TaxConfiguration;

  // Analysis (cached)
  projections: FinancialProjection[];
  scenarios: WhatIfScenario[];
  insights: FinancialInsight[];
  healthScore?: FinancialHealthScore;

  // Metadata
  lastImportDate?: string;
  lastAnalysisDate?: string;
  dataQualityScore: number; // 0-100
  currency: "EUR" | "USD";

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============= API RESPONSES =============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface ConfigurationReview {
  incomeSources: {
    detected: IncomeSource[];
    needsConfirmation: IncomeSource[];
    suggestions: string[];
  };
  recurringExpenses: {
    detected: RecurringExpense[];
    needsConfirmation: RecurringExpense[];
    suggestions: string[];
  };
  loans: {
    detected: Loan[];
    needsConfirmation: Loan[];
    suggestions: string[];
  };
  dataQuality: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

// ============= HELPER TYPES =============

export type Currency = "EUR" | "USD" | "GBP";

export type FrequencyType =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type ConfidenceLevel = "high" | "medium" | "low";

// ============= UTILITY FUNCTIONS =============

export function formatCurrency(
  amount: number,
  currency: Currency = "EUR"
): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function calculateMonthlyAmount(
  amount: number,
  frequency: FrequencyType
): number {
  const multipliers = {
    weekly: 52 / 12,
    biweekly: 26 / 12,
    monthly: 1,
    quarterly: 1 / 3,
    yearly: 1 / 12,
  };
  return amount * multipliers[frequency];
}

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
