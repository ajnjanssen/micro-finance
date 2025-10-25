/**
 * Transaction Validator & Categorizer
 *
 * Core module for deterministic, auditable financial data operations.
 * Used by both frontend API routes and backend scripts.
 *
 * Key principles:
 * - Deterministic: Same input → Same output
 * - Auditable: All categorizations log their reasoning
 * - Strict: No assumptions or fuzzy matching
 * - Type-safe: Full TypeScript validation
 */

import type { Transaction, Account } from "@/types/finance";

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface CategoryResult {
  category: string;
  reason: string;
}

export interface RecurringResult {
  isRecurring: boolean;
  recurringType?: "monthly" | "yearly" | "weekly";
  reason?: string;
}

// ===== CATEGORIZATION RULES =====

interface CategoryRule {
  keywords: string[];
  requireAll?: boolean; // If true, ALL keywords must match
  type: "income" | "expense";
  amountRange?: { min?: number; max?: number };
}

const CATEGORY_RULES: Record<string, CategoryRule> = {
  // INCOME
  salary: {
    keywords: ["exact cloud development", "exact cloud", "vrijdagonline"],
    type: "income",
    amountRange: { min: 2500, max: 3200 },
  },
  bonus: {
    keywords: ["dertiende maand", "13e maand", "vakantiegeld", "bonus"],
    type: "income",
  },
  "investment-income": {
    keywords: [
      "restitutie",
      "terugbetaling",
      "refund",
      "reimbursement",
      "nijboer",
      "meurs",
      "janssen",
      "harms",
    ],
    type: "income",
  },

  // HOUSING
  housing: {
    keywords: [
      "huur",
      "patrimonium",
      "woningstichting",
      "eneco",
      "anwb energie",
      "ziggo",
      "kpn",
      "manuputty",
      "vastgoed",
      "woningbouw",
    ],
    type: "expense",
  },

  // INSURANCE & FIXED COSTS
  insurance: {
    keywords: [
      "verzekering",
      "zorgverzekering",
      "zilveren kruis",
      "menzis",
      "belastingdienst",
      "monuta",
      "asr",
      "oranjepakket",
      "nn schadeverzekering",
    ],
    type: "expense",
  },

  // GROCERIES
  groceries: {
    keywords: [
      "plus",
      "ah to go",
      "albert heijn",
      "jumbo",
      "lidl",
      "aldi",
      "dirk",
      "coop",
    ],
    type: "expense",
  },

  // FOOD & DRINKS
  food: {
    keywords: [
      "mcdonald",
      "kfc",
      "burger king",
      "subway",
      "domino",
      "pizza",
      "tango",
      "restaurant",
      "thuisbezorgd",
      "uber eats",
    ],
    type: "expense",
  },

  // SHOPPING
  shopping: {
    keywords: [
      "flink",
      "coolblue",
      "bol.com",
      "amazon",
      "vans",
      "nike",
      "h&m",
      "zara",
      "limbo",
      "action",
      "hema",
      "kruidvat",
    ],
    type: "expense",
  },

  // TRANSPORT
  transport: {
    keywords: [
      "ov-chipkaart",
      "tls",
      "ns ",
      "arriva",
      "connexxion",
      "shell",
      "esso",
      "bp ",
      "texaco",
    ],
    type: "expense",
  },

  // ENTERTAINMENT
  entertainment: {
    keywords: [
      "kart",
      "teamsport",
      "netflix",
      "spotify",
      "disney",
      "bioscoop",
      "pathe",
      "fitness",
    ],
    type: "expense",
  },

  // SAVINGS
  savings: {
    keywords: ["oranje spaarrekening", "spaarrekening"],
    type: "expense", // Transfers out are expenses from checking account
  },
};

/**
 * Categorize a transaction deterministically.
 * Returns both the category and the reasoning for audit trails.
 */
export function categorizeTransaction(
  description: string,
  details: string = "",
  amount: number
): CategoryResult {
  const searchText = `${description} ${details}`.toLowerCase();

  // Check each category rule
  for (const [category, rule] of Object.entries(CATEGORY_RULES)) {
    const matchedKeywords: string[] = [];

    for (const keyword of rule.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    // Check if rule matches
    const hasMatch = rule.requireAll
      ? matchedKeywords.length === rule.keywords.length
      : matchedKeywords.length > 0;

    if (hasMatch) {
      // Check amount range if specified
      if (rule.amountRange) {
        const absAmount = Math.abs(amount);
        const { min = 0, max = Infinity } = rule.amountRange;
        if (absAmount < min || absAmount > max) {
          continue; // Amount out of range, try next rule
        }
      }

      return {
        category,
        reason: `Matched keywords: ${matchedKeywords.join(", ")}`,
      };
    }
  }

  // No rule matched
  return {
    category: "uncategorized",
    reason: "No matching category rule found",
  };
}

// ===== RECURRING DETECTION =====

interface RecurringPattern {
  keywords: string[];
  requireAll?: boolean;
  type: "monthly" | "yearly" | "weekly";
}

const RECURRING_PATTERNS: RecurringPattern[] = [
  // SALARY (current employer only)
  {
    keywords: ["exact cloud development"],
    type: "monthly",
  },

  // FIXED EXPENSES
  {
    keywords: ["oranjepakket"],
    type: "monthly",
  },
  {
    keywords: ["patrimonium"],
    type: "monthly",
  },
  {
    keywords: ["menzis", "zorgverzekeraar"],
    requireAll: true,
    type: "monthly",
  },
  {
    keywords: ["belastingkant", "noordelijk"],
    requireAll: true,
    type: "monthly",
  },
  {
    keywords: ["netflix international b.v."],
    type: "monthly",
  },
  {
    keywords: ["flitsmeister b.v. via mollie"],
    type: "monthly",
  },
  {
    keywords: ["ov-chipkaart", "tls", "automatisch"],
    requireAll: true,
    type: "monthly",
  },
];

/**
 * Detect if a transaction is recurring.
 * Only marks transactions with confirmed recurring patterns.
 */
export function detectRecurring(
  description: string,
  details: string = "",
  amount: number
): RecurringResult {
  const searchText = `${description} ${details}`.toLowerCase();

  for (const pattern of RECURRING_PATTERNS) {
    const matchedKeywords: string[] = [];

    for (const keyword of pattern.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    const hasMatch = pattern.requireAll
      ? matchedKeywords.length === pattern.keywords.length
      : matchedKeywords.length > 0;

    if (hasMatch) {
      return {
        isRecurring: true,
        recurringType: pattern.type,
        reason: `Matched pattern: ${matchedKeywords.join(" + ")}`,
      };
    }
  }

  return {
    isRecurring: false,
  };
}

// ===== TAG EXTRACTION =====

/**
 * Extract tags from transaction description and details.
 */
export function extractTags(
  description: string,
  details: string = ""
): string[] {
  const tags: string[] = [];
  const searchText = `${description} ${details}`.toLowerCase();

  if (searchText.includes("apple pay")) tags.push("apple-pay");
  if (searchText.includes("ideal")) tags.push("ideal");
  if (searchText.includes("retour")) tags.push("refund");
  if (searchText.includes("automatisch")) tags.push("automatic");

  return tags;
}

// ===== VALIDATION =====

/**
 * Validate a transaction for correctness and consistency.
 */
export function validateTransaction(
  transaction: Partial<Transaction>,
  accounts: Account[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!transaction.description || transaction.description.trim() === "") {
    errors.push({
      field: "description",
      message: "Description is required",
      value: transaction.description,
    });
  }

  if (transaction.amount === undefined || transaction.amount === null) {
    errors.push({
      field: "amount",
      message: "Amount is required",
      value: transaction.amount,
    });
  } else if (Number.isNaN(transaction.amount)) {
    errors.push({
      field: "amount",
      message: "Amount must be a valid number",
      value: transaction.amount,
    });
  }

  if (!transaction.date) {
    errors.push({
      field: "date",
      message: "Date is required",
      value: transaction.date,
    });
  } else {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(transaction.date)) {
      errors.push({
        field: "date",
        message: "Date must be in YYYY-MM-DD format",
        value: transaction.date,
      });
    }
  }

  if (!transaction.accountId) {
    errors.push({
      field: "accountId",
      message: "Account ID is required",
      value: transaction.accountId,
    });
  } else {
    // Check if account exists
    const accountExists = accounts.some(
      (acc) => acc.id === transaction.accountId
    );
    if (!accountExists) {
      errors.push({
        field: "accountId",
        message: "Account does not exist",
        value: transaction.accountId,
      });
    }
  }

  // Amount sign consistency
  if (
    transaction.type &&
    transaction.amount !== undefined &&
    !Number.isNaN(transaction.amount)
  ) {
    if (transaction.type === "income" && transaction.amount < 0) {
      errors.push({
        field: "amount",
        message: "Income must have positive amount",
        value: transaction.amount,
      });
    }
    if (transaction.type === "expense" && transaction.amount > 0) {
      errors.push({
        field: "amount",
        message: "Expense must have negative amount",
        value: transaction.amount,
      });
    }
  }

  return errors;
}

/**
 * Check if a transaction is a duplicate.
 * Uses composite key: description|date|amount
 */
export function isDuplicate(
  transaction: Partial<Transaction>,
  existingTransactions: Transaction[]
): boolean {
  if (
    !transaction.description ||
    !transaction.date ||
    transaction.amount === undefined
  ) {
    return false; // Can't determine if incomplete
  }

  const key = `${transaction.description}|${transaction.date}|${transaction.amount}`;
  return existingTransactions.some(
    (t) => `${t.description}|${t.date}|${t.amount}` === key
  );
}

/**
 * Enrich a transaction with categorization, recurring detection, and tags.
 * Preserves manually set values (category, isRecurring, tags) if they exist.
 */
export function enrichTransaction(
  transaction: Partial<Transaction>
): Partial<Transaction> {
  const { description = "", amount = 0 } = transaction;
  const details = ""; // Can be extended if needed

  // Only auto-categorize if no category is set
  const { category, reason } = transaction.category
    ? { category: transaction.category, reason: "Manually set" }
    : categorizeTransaction(description, details, amount);

  // Only auto-detect recurring if not explicitly set
  const recurring =
    transaction.isRecurring !== undefined
      ? {
          isRecurring: transaction.isRecurring,
          recurringType: transaction.recurringType,
          reason: "Manually set",
        }
      : detectRecurring(description, details, amount);

  // Only auto-extract tags if none are set
  const tags =
    transaction.tags && transaction.tags.length > 0
      ? transaction.tags
      : extractTags(description, details);

  return {
    ...transaction,
    category,
    categoryReason: reason,
    isRecurring: recurring.isRecurring,
    ...(recurring.recurringType && { recurringType: recurring.recurringType }),
    ...(tags.length > 0 && { tags }),
  };
}
