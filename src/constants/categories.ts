/**
 * Category Constants
 * Single source of truth for all category-related constants
 */

// Standard budget categories
export const BUDGET_CATEGORIES = {
  HOUSING: "housing",
  INSURANCE: "insurance",
  TRANSPORT: "transport",
  GROCERIES: "groceries",
  FOOD: "food",
  ENTERTAINMENT: "entertainment",
  SHOPPING: "shopping",
  VACATION: "vacation",
  SAVINGS: "savings",
} as const;

export type BudgetCategory =
  (typeof BUDGET_CATEGORIES)[keyof typeof BUDGET_CATEGORIES];

// Budget type classification (50/30/20 rule)
export const BUDGET_TYPES = {
  NEEDS: "needs",
  WANTS: "wants",
  SAVINGS: "savings",
} as const;

export type BudgetType = (typeof BUDGET_TYPES)[keyof typeof BUDGET_TYPES];

// 50/30/20 percentages
export const BUDGET_PERCENTAGES = {
  NEEDS: 0.5,
  WANTS: 0.3,
  SAVINGS: 0.2,
} as const;

// Frequency conversion to monthly multiplier
export const FREQUENCY_TO_MONTHLY = {
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
  weekly: 52 / 12,
  biweekly: 26 / 12,
} as const;

export type Frequency = keyof typeof FREQUENCY_TO_MONTHLY;

// Dutch to English category mapping
export const DUTCH_TO_ENGLISH_CATEGORIES: Record<string, BudgetCategory> = {
  boodschappen: BUDGET_CATEGORIES.GROCERIES,
  "eten drinken": BUDGET_CATEGORIES.FOOD,
  "eten en drinken": BUDGET_CATEGORIES.FOOD,
  entertainment: BUDGET_CATEGORIES.ENTERTAINMENT,
  verzekeringen: BUDGET_CATEGORIES.INSURANCE,
  verzekering: BUDGET_CATEGORIES.INSURANCE,
  belastingdienst: BUDGET_CATEGORIES.HOUSING,
  belasting: BUDGET_CATEGORIES.HOUSING,
  onbekend: BUDGET_CATEGORIES.SHOPPING,
  klarna: BUDGET_CATEGORIES.SHOPPING,
  sparen: BUDGET_CATEGORIES.VACATION,
  saving: BUDGET_CATEGORIES.VACATION,
  savings: BUDGET_CATEGORIES.VACATION,
  "health insurance": BUDGET_CATEGORIES.INSURANCE,
  healthinsurance: BUDGET_CATEGORIES.INSURANCE,
  gezondheid: BUDGET_CATEGORIES.INSURANCE,
  voorschieten: BUDGET_CATEGORIES.SHOPPING,
  winkelen: BUDGET_CATEGORIES.SHOPPING,
  shopping: BUDGET_CATEGORIES.SHOPPING,
  motor: BUDGET_CATEGORIES.TRANSPORT,
  auto: BUDGET_CATEGORIES.TRANSPORT,
  car: BUDGET_CATEGORIES.TRANSPORT,
  wonen: BUDGET_CATEGORIES.HOUSING,
  living: BUDGET_CATEGORIES.HOUSING,
  transport: BUDGET_CATEGORIES.TRANSPORT,
  vervoer: BUDGET_CATEGORIES.TRANSPORT,
  dining: BUDGET_CATEGORIES.FOOD,
  fuel: BUDGET_CATEGORIES.TRANSPORT,
  brandstof: BUDGET_CATEGORIES.TRANSPORT,
  "public transport": BUDGET_CATEGORIES.TRANSPORT,
  ov: BUDGET_CATEGORIES.TRANSPORT,
  subscriptions: BUDGET_CATEGORIES.ENTERTAINMENT,
  abonnementen: BUDGET_CATEGORIES.ENTERTAINMENT,
  "bank fees": BUDGET_CATEGORIES.SHOPPING,
  rent: BUDGET_CATEGORIES.HOUSING,
  huur: BUDGET_CATEGORIES.HOUSING,
  utilities: BUDGET_CATEGORIES.HOUSING,
  energie: BUDGET_CATEGORIES.HOUSING,
  water: BUDGET_CATEGORIES.HOUSING,
  telefoon: BUDGET_CATEGORIES.HOUSING,
  phone: BUDGET_CATEGORIES.HOUSING,
  schuld: BUDGET_CATEGORIES.HOUSING,
  debt: BUDGET_CATEGORIES.HOUSING,
};

// Category to budget type mapping
export const CATEGORY_TO_BUDGET_TYPE: Record<BudgetCategory, BudgetType> = {
  [BUDGET_CATEGORIES.HOUSING]: BUDGET_TYPES.NEEDS,
  [BUDGET_CATEGORIES.INSURANCE]: BUDGET_TYPES.NEEDS,
  [BUDGET_CATEGORIES.GROCERIES]: BUDGET_TYPES.WANTS, // Forced to wants per user preference
  [BUDGET_CATEGORIES.TRANSPORT]: BUDGET_TYPES.NEEDS,
  [BUDGET_CATEGORIES.FOOD]: BUDGET_TYPES.WANTS,
  [BUDGET_CATEGORIES.ENTERTAINMENT]: BUDGET_TYPES.WANTS,
  [BUDGET_CATEGORIES.SHOPPING]: BUDGET_TYPES.WANTS,
  [BUDGET_CATEGORIES.VACATION]: BUDGET_TYPES.WANTS,
  [BUDGET_CATEGORIES.SAVINGS]: BUDGET_TYPES.SAVINGS,
};

// Variable vs Fixed classification
export const VARIABLE_CATEGORIES: BudgetCategory[] = [
  BUDGET_CATEGORIES.GROCERIES,
  BUDGET_CATEGORIES.FOOD,
  BUDGET_CATEGORIES.ENTERTAINMENT,
  BUDGET_CATEGORIES.SHOPPING,
  BUDGET_CATEGORIES.VACATION,
  BUDGET_CATEGORIES.TRANSPORT,
];

export const FIXED_CATEGORIES: BudgetCategory[] = [
  BUDGET_CATEGORIES.HOUSING,
  BUDGET_CATEGORIES.INSURANCE,
];

// Savings transaction detection patterns
export const SAVINGS_TRANSACTION_PATTERNS = {
  keywords: ["spaardoel", "savings goal"],
  shortKeyword: "sparen",
  shortKeywordMaxLength: 20,
} as const;
