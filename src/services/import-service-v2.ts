/**
 * Enhanced Import Service v2.0
 *
 * Features:
 * - Smart categorization with confidence scoring
 * - Advanced recurring pattern detection
 * - Automatic configuration extraction
 * - Data quality analysis
 */

import { parse } from "csv-parse/sync";
import type {
  Transaction,
  TransactionCategory,
  RecurringPattern,
  ImportResult,
  IncomeSource,
  RecurringExpense,
  Loan,
  ImportError,
  ImportWarning,
  FinancialDataV2,
} from "@/types/finance-v2";
import { generateId, calculateMonthlyAmount } from "@/types/finance-v2";

interface CSVRow {
  datum: string;
  naam_omschrijving?: string;
  omschrijving?: string;
  rekening: string;
  rekening_naam?: string;
  tegenrekening: string;
  code?: string;
  af_bij: string;
  bedrag: string;
  valuta?: string;
  mutatiesoort: string;
  mededelingen: string;
  saldo_na_mutatie: string;
  tag?: string;
}

interface CategorizationRule {
  keywords: string[];
  amountRange?: { min?: number; max?: number };
  subcategory?: string;
}

interface CategorizationResult {
  category: TransactionCategory;
  subcategory?: string;
  confidence: number; // 0-100
  reason: string;
  matchedKeywords: string[];
}

interface RecurringDetectionResult {
  isRecurring: boolean;
  pattern?: RecurringPattern;
  groupId?: string;
  confidence: number; // 0-100
  reason: string;
}

export class ImportServiceV2 {
  private categorizationRules = this.buildCategorizationRules();
  private recurringPatterns = this.buildRecurringPatterns();

  /**
   * Main import pipeline
   */
  async importCSV(
    fileContent: string,
    fileName: string,
    accountId: string,
    existingData: FinancialDataV2
  ): Promise<ImportResult> {
    const batchId = generateId();
    const importDate = new Date().toISOString();

    try {
      // 1. Parse CSV
      const rows = this.parseCSV(fileContent);

      // 2. Convert to transactions
      const rawTransactions = this.convertToTransactions(
        rows,
        accountId,
        batchId,
        importDate
      );

      // 3. Filter duplicates
      const { newTransactions, skipped } = this.filterDuplicates(
        rawTransactions,
        existingData.transactions
      );

      // 4. Auto-categorize with confidence
      const categorized = this.autoCategorize(newTransactions);

      // 5. Detect recurring patterns
      const withRecurring = this.detectRecurringPatterns(
        categorized,
        existingData.transactions
      );

      // 6. Extract tags
      const withTags = this.extractTags(withRecurring);

      // 7. Analyze for configuration
      const detectedConfig = this.extractConfiguration(withTags, existingData);

      // 8. Generate warnings
      const warnings = this.generateWarnings(withTags);

      // 9. Calculate statistics
      const stats = this.calculateStatistics(withTags);

      // 10. Determine what needs review
      const needsReview = withTags.filter(
        (t) =>
          t.autoCategorizationConfidence < 80 ||
          (t.isRecurring && (t.recurringConfidence || 0) < 70)
      );

      return {
        batchId,
        importDate,
        fileName,
        transactions: withTags,
        totalRows: rows.length,
        imported: withTags.length,
        skipped,
        needsReview: needsReview.length,
        ...stats,
        ...detectedConfig,
        errors: [],
        warnings,
      };
    } catch (error) {
      throw new Error(
        `Import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Parse CSV content
   */
  private parseCSV(content: string): CSVRow[] {
    const firstLine = content.split("\n")[0];
    const isSavingsFormat = firstLine.includes("Rekening naam");

    const columns = isSavingsFormat
      ? [
          "datum",
          "omschrijving",
          "rekening",
          "rekening_naam",
          "tegenrekening",
          "af_bij",
          "bedrag",
          "valuta",
          "mutatiesoort",
          "mededelingen",
          "saldo_na_mutatie",
        ]
      : [
          "datum",
          "naam_omschrijving",
          "rekening",
          "tegenrekening",
          "code",
          "af_bij",
          "bedrag",
          "mutatiesoort",
          "mededelingen",
          "saldo_na_mutatie",
          "tag",
        ];

    return parse(content, {
      delimiter: ";",
      skip_empty_lines: true,
      from_line: 2,
      columns: columns,
    });
  }

  /**
   * Convert CSV rows to transactions
   */
  private convertToTransactions(
    rows: CSVRow[],
    accountId: string,
    batchId: string,
    importDate: string
  ): Transaction[] {
    return rows
      .map((row) => {
        try {
          const amount = parseFloat(row.bedrag.replace(",", "."));
          const isIncome = row.af_bij === "Bij";
          const finalAmount = isIncome ? amount : -amount;

          const description =
            row.naam_omschrijving ||
            row.omschrijving ||
            row.mededelingen.match(/Naam: ([^O]+)/)?.[1]?.trim() ||
            "Unknown";

          const date = this.parseDate(row.datum);

          return {
            id: generateId(),
            date,
            description: description.trim(),
            amount: finalAmount,
            category: "uncategorized" as TransactionCategory,
            autoCategorizationConfidence: 0,
            categorizationReason: "",
            manuallyReviewed: false,
            isRecurring: false,
            accountId,
            tags: [],
            taxDeductible: false,
            importSource: "csv" as const,
            importDate,
            importBatch: batchId,
          } as Transaction;
        } catch (error) {
          console.error("Failed to convert row:", row, error);
          return null;
        }
      })
      .filter((t): t is Transaction => t !== null);
  }

  /**
   * Parse various date formats
   */
  private parseDate(dateString: string): string {
    // YYYYMMDD
    if (dateString.length === 8 && !dateString.includes("-")) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${year}-${month}-${day}`;
    }

    // DD-MM-YYYY
    if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = dateString.split("-");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // YYYY-MM-DD (already correct)
    return dateString;
  }

  /**
   * Filter out duplicate transactions
   */
  private filterDuplicates(
    newTransactions: Transaction[],
    existingTransactions: Transaction[]
  ): { newTransactions: Transaction[]; skipped: number } {
    const existingKeys = new Set(
      existingTransactions.map((t) => `${t.description}|${t.date}|${t.amount}`)
    );

    const unique: Transaction[] = [];
    let skipped = 0;

    for (const tx of newTransactions) {
      const key = `${tx.description}|${tx.date}|${tx.amount}`;
      if (existingKeys.has(key)) {
        skipped++;
      } else {
        unique.push(tx);
        existingKeys.add(key);
      }
    }

    return { newTransactions: unique, skipped };
  }

  /**
   * Auto-categorize transactions with confidence scoring
   */
  private autoCategorize(transactions: Transaction[]): Transaction[] {
    return transactions.map((tx) => {
      const result = this.categorizeTransaction(tx.description, tx.amount);

      return {
        ...tx,
        category: result.category,
        subcategory: result.subcategory,
        autoCategorizationConfidence: result.confidence,
        categorizationReason: result.reason,
      };
    });
  }

  /**
   * Categorize a single transaction
   */
  private categorizeTransaction(
    description: string,
    amount: number
  ): CategorizationResult {
    const searchText = description.toLowerCase();
    const absAmount = Math.abs(amount);

    // Try each category rule
    for (const [category, ruleObj] of Object.entries(
      this.categorizationRules
    )) {
      const rule = ruleObj as CategorizationRule;
      const matched = rule.keywords.filter((kw: string) =>
        searchText.includes(kw.toLowerCase())
      );

      if (matched.length === 0) continue;

      // Check amount range if specified
      if (rule.amountRange) {
        const { min = 0, max = Infinity } = rule.amountRange;
        if (absAmount < min || absAmount > max) continue;
      }

      // Calculate confidence based on keyword specificity
      const confidence = this.calculateCategorizationConfidence(
        matched,
        rule.keywords,
        absAmount,
        rule.amountRange
      );

      return {
        category: category as TransactionCategory,
        subcategory: rule.subcategory,
        confidence,
        reason: `Matched keywords: ${matched.join(", ")}`,
        matchedKeywords: matched,
      };
    }

    // No match found
    return {
      category: "uncategorized",
      confidence: 0,
      reason: "No matching category rule found",
      matchedKeywords: [],
    };
  }

  /**
   * Calculate categorization confidence
   */
  private calculateCategorizationConfidence(
    matched: string[],
    total: string[],
    amount: number,
    amountRange?: { min?: number; max?: number }
  ): number {
    let confidence = 50; // Base confidence

    // More keywords matched = higher confidence
    const matchRatio = matched.length / total.length;
    confidence += matchRatio * 30;

    // Amount in expected range = higher confidence
    if (amountRange) {
      const absAmount = Math.abs(amount);
      const { min = 0, max = Infinity } = amountRange;
      const midpoint = (min + max) / 2;
      const distance = Math.abs(absAmount - midpoint) / midpoint;
      confidence += Math.max(0, 20 - distance * 20);
    }

    return Math.min(100, Math.round(confidence));
  }

  /**
   * Detect recurring patterns in transactions
   */
  private detectRecurringPatterns(
    newTransactions: Transaction[],
    historicalTransactions: Transaction[]
  ): Transaction[] {
    const allTransactions = [...historicalTransactions, ...newTransactions];

    // Group similar transactions
    const groups = this.groupSimilarTransactions(allTransactions);

    // Analyze each group for patterns
    const patterns = new Map<string, RecurringDetectionResult>();

    for (const group of groups) {
      if (group.length < 2) continue; // Need at least 2 occurrences

      const pattern = this.analyzeRecurringPattern(group);
      if (pattern.isRecurring) {
        const groupId = generateId();
        group.forEach((tx) => {
          patterns.set(tx.id, { ...pattern, groupId });
        });
      }
    }

    // Apply patterns to new transactions
    return newTransactions.map((tx) => {
      const pattern = patterns.get(tx.id);
      if (!pattern) return tx;

      return {
        ...tx,
        isRecurring: pattern.isRecurring,
        recurringPattern: pattern.pattern,
        recurringGroupId: pattern.groupId,
        recurringConfidence: pattern.confidence,
      };
    });
  }

  /**
   * Group similar transactions
   */
  private groupSimilarTransactions(
    transactions: Transaction[]
  ): Transaction[][] {
    const groups = new Map<string, Transaction[]>();

    for (const tx of transactions) {
      // Normalize description for grouping
      const normalized = tx.description
        .toLowerCase()
        .replace(/\d{2}-\d{2}-\d{4}/g, "") // Remove dates
        .replace(/\d+/g, "") // Remove numbers
        .trim();

      const key = `${normalized}|${Math.round(Math.abs(tx.amount) / 10) * 10}`; // Round amount to nearest 10

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(tx);
    }

    return Array.from(groups.values());
  }

  /**
   * Analyze a group of transactions for recurring patterns
   */
  private analyzeRecurringPattern(
    transactions: Transaction[]
  ): RecurringDetectionResult {
    if (transactions.length < 2) {
      return {
        isRecurring: false,
        confidence: 0,
        reason: "Insufficient occurrences",
      };
    }

    // Sort by date
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate intervals between transactions (in days)
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days =
        (new Date(sorted[i].date).getTime() -
          new Date(sorted[i - 1].date).getTime()) /
        (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    // Check for consistent intervals
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgInterval;

    // Determine frequency
    let frequency: RecurringPattern["frequency"] | null = null;
    if (avgInterval >= 25 && avgInterval <= 35) frequency = "monthly";
    else if (avgInterval >= 11 && avgInterval <= 17) frequency = "biweekly";
    else if (avgInterval >= 5 && avgInterval <= 9) frequency = "weekly";
    else if (avgInterval >= 85 && avgInterval <= 95) frequency = "quarterly";
    else if (avgInterval >= 350 && avgInterval <= 380) frequency = "yearly";

    if (!frequency) {
      return {
        isRecurring: false,
        confidence: 0,
        reason: "No consistent interval detected",
      };
    }

    // Check amount consistency
    const amounts = sorted.map((t) => Math.abs(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountVariance =
      amounts.reduce((sum, val) => sum + Math.pow(val - avgAmount, 2), 0) /
      amounts.length;
    const amountStdDev = Math.sqrt(amountVariance);
    const amountCV = amountStdDev / avgAmount;

    // Calculate confidence
    let confidence = 100;
    confidence -= coefficientOfVariation * 50; // Penalize interval variance
    confidence -= amountCV * 30; // Penalize amount variance
    confidence -= Math.max(0, (5 - sorted.length) * 10); // Penalize few occurrences
    confidence = Math.max(0, Math.min(100, confidence));

    if (confidence < 50) {
      return {
        isRecurring: false,
        confidence,
        reason: "Pattern too inconsistent",
      };
    }

    // Calculate next expected date
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + avgInterval);

    return {
      isRecurring: true,
      pattern: {
        frequency,
        expectedAmount: avgAmount,
        amountTolerance: amountCV * 100,
        nextExpectedDate: nextDate.toISOString().split("T")[0],
        lastOccurrence: sorted[sorted.length - 1].date,
        occurrenceCount: sorted.length,
        confidence,
      },
      confidence,
      reason: `Detected ${frequency} pattern with ${sorted.length} occurrences`,
    };
  }

  /**
   * Extract tags from transactions
   */
  private extractTags(transactions: Transaction[]): Transaction[] {
    return transactions.map((tx) => {
      const tags: string[] = [];
      const text = (tx.description + " " + (tx.notes || "")).toLowerCase();

      if (text.includes("apple pay")) tags.push("apple-pay");
      if (text.includes("ideal")) tags.push("ideal");
      if (text.includes("retour") || text.includes("refund"))
        tags.push("refund");
      if (text.includes("automatisch") || text.includes("automatic"))
        tags.push("automatic");
      if (text.includes("incasso")) tags.push("direct-debit");
      if (Math.abs(tx.amount) > 1000) tags.push("large-transaction");

      return { ...tx, tags };
    });
  }

  /**
   * Extract configuration from imported transactions
   */
  private extractConfiguration(
    transactions: Transaction[],
    existingData: FinancialDataV2
  ): {
    detectedIncomeSources: IncomeSource[];
    detectedRecurringExpenses: RecurringExpense[];
    suggestedLoans: Loan[];
  } {
    // Detect income sources
    const incomeSources = this.detectIncomeSources(transactions);

    // Detect recurring expenses
    const recurringExpenses = this.detectRecurringExpenses(transactions);

    // Suggest potential loans (large regular payments)
    const suggestedLoans = this.detectPotentialLoans(transactions);

    return {
      detectedIncomeSources: incomeSources,
      detectedRecurringExpenses: recurringExpenses,
      suggestedLoans,
    };
  }

  /**
   * Detect income sources from transactions
   */
  private detectIncomeSources(transactions: Transaction[]): IncomeSource[] {
    const incomeTransactions = transactions.filter(
      (t) => t.amount > 0 && t.isRecurring && t.recurringPattern
    );

    const sources: IncomeSource[] = [];

    for (const tx of incomeTransactions) {
      if (!tx.recurringPattern) continue;

      const monthlyAmount = calculateMonthlyAmount(
        tx.amount,
        tx.recurringPattern.frequency
      );

      sources.push({
        id: generateId(),
        name: tx.description,
        type: tx.category === "salary" ? "salary" : "other",
        monthlyAmount,
        frequency:
          tx.recurringPattern.frequency === "biweekly" ||
          tx.recurringPattern.frequency === "weekly"
            ? tx.recurringPattern.frequency
            : "monthly",
        taxable: true,
        startDate: tx.date,
        confidence: tx.recurringConfidence! >= 70 ? "confirmed" : "estimated",
        linkedTransactionIds: [tx.id],
      });
    }

    return sources;
  }

  /**
   * Detect recurring expenses from transactions
   */
  private detectRecurringExpenses(
    transactions: Transaction[]
  ): RecurringExpense[] {
    const expenseTransactions = transactions.filter(
      (t) => t.amount < 0 && t.isRecurring && t.recurringPattern
    );

    const expenses: RecurringExpense[] = [];

    for (const tx of expenseTransactions) {
      if (!tx.recurringPattern) continue;

      const monthlyAmount = calculateMonthlyAmount(
        Math.abs(tx.amount),
        tx.recurringPattern.frequency
      );

      // Determine if essential
      const isEssential = [
        "rent",
        "mortgage",
        "utilities",
        "health-insurance",
        "loan-payment",
      ].includes(tx.category);

      // Map frequency to RecurringExpense type
      let expenseFrequency: "weekly" | "monthly" | "quarterly" | "yearly" =
        "monthly";
      if (tx.recurringPattern.frequency === "weekly")
        expenseFrequency = "weekly";
      else if (tx.recurringPattern.frequency === "quarterly")
        expenseFrequency = "quarterly";
      else if (tx.recurringPattern.frequency === "yearly")
        expenseFrequency = "yearly";

      expenses.push({
        id: generateId(),
        name: tx.description,
        category: tx.category,
        monthlyAmount,
        frequency: expenseFrequency,
        isEssential,
        canReduce: !isEssential,
        reductionPotential: isEssential ? 0 : 20, // Suggest 20% reduction for non-essential
        linkedTransactionIds: [tx.id],
        startDate: tx.date,
        confidence: tx.recurringConfidence!,
      });
    }

    return expenses;
  }

  /**
   * Detect potential loans from large regular payments
   */
  private detectPotentialLoans(transactions: Transaction[]): Loan[] {
    const largeRecurringPayments = transactions.filter(
      (t) =>
        t.amount < 0 &&
        Math.abs(t.amount) > 50 &&
        t.isRecurring &&
        t.recurringPattern?.frequency === "monthly"
    );

    // Group by description similarity
    // This is simplified - in reality would need more sophisticated grouping
    return [];
  }

  /**
   * Generate warnings for the import
   */
  private generateWarnings(transactions: Transaction[]): ImportWarning[] {
    const warnings: ImportWarning[] = [];

    // Low confidence categorizations
    const lowConfidence = transactions.filter(
      (t) => t.autoCategorizationConfidence < 50
    );
    if (lowConfidence.length > 0) {
      warnings.push({
        type: "low-confidence",
        message: `${lowConfidence.length} transactions have low categorization confidence`,
        transactionIds: lowConfidence.map((t) => t.id),
      });
    }

    // Unusual amounts
    const amounts = transactions.map((t) => Math.abs(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const unusualTransactions = transactions.filter(
      (t) => Math.abs(t.amount) > avgAmount * 3
    );
    if (unusualTransactions.length > 0) {
      warnings.push({
        type: "unusual-amount",
        message: `${unusualTransactions.length} transactions have unusually large amounts`,
        transactionIds: unusualTransactions.map((t) => t.id),
      });
    }

    return warnings;
  }

  /**
   * Calculate statistics for the import
   */
  private calculateStatistics(transactions: Transaction[]) {
    const dates = transactions.map((t) => t.date).sort();
    const dateRange = {
      start: dates[0] || "",
      end: dates[dates.length - 1] || "",
    };

    const totalIncome = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = Math.abs(
      transactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const categoryBreakdown: { [key: string]: number } = {};
    for (const tx of transactions) {
      categoryBreakdown[tx.category] =
        (categoryBreakdown[tx.category] || 0) + 1;
    }

    const high = transactions.filter(
      (t) => t.autoCategorizationConfidence >= 80
    ).length;
    const medium = transactions.filter(
      (t) =>
        t.autoCategorizationConfidence >= 50 &&
        t.autoCategorizationConfidence < 80
    ).length;
    const low = transactions.filter(
      (t) => t.autoCategorizationConfidence < 50
    ).length;

    const recurringDetected = transactions.filter((t) => t.isRecurring).length;
    const recurringConfirmed = transactions.filter(
      (t) => t.isRecurring && (t.recurringConfidence || 0) >= 70
    ).length;

    return {
      dateRange,
      totalIncome,
      totalExpenses,
      categoryBreakdown,
      confidenceDistribution: { high, medium, low },
      recurringDetected,
      recurringConfirmed,
    };
  }

  /**
   * Build categorization rules
   */
  private buildCategorizationRules(): Record<string, CategorizationRule> {
    return {
      // Income
      salary: {
        keywords: [
          "exact cloud development",
          "exact cloud",
          "vrijdagonline",
          "salaris",
          "loon",
        ],
        amountRange: { min: 100, max: 10000 }, // Allow smaller amounts for partial payments
      },
      bonus: {
        keywords: ["dertiende maand", "13e maand", "vakantiegeld", "bonus"],
        amountRange: { min: 500 },
      },
      "investment-income": {
        keywords: [
          "dividend",
          "interest",
          "capital gain",
          "crypto",
          "restitutie",
          "terugbetaling",
        ],
      },

      // Housing
      rent: {
        keywords: ["huur", "rent", "patrimonium", "woningstichting"],
        amountRange: { min: 25, max: 3000 }, // Allow smaller amounts for additional rent charges
      },
      utilities: {
        keywords: [
          "eneco",
          "ziggo",
          "kpn",
          "t-mobile",
          "vodafone",
          "anwb energie",
          "energie",
          "gas & licht",
        ],
        amountRange: { min: 10, max: 500 },
      },

      // Food
      groceries: {
        keywords: [
          "albert heijn",
          "ah paterswolde",
          "ah to go",
          "plus",
          "jumbo",
          "lidl",
          "aldi",
          "dirk",
          "coop",
        ],
        amountRange: { max: 200 },
      },
      dining: {
        keywords: [
          "tango",
          "mcdonald",
          "kfc",
          "burger king",
          "subway",
          "domino",
          "pizza",
          "restaurant",
          "thuisbezorgd",
        ],
      },

      // Transport
      "public-transport": {
        keywords: ["ov-chipkaart", "tls", "ns ", "arriva", "connexxion"],
        amountRange: { max: 200 },
      },
      fuel: {
        keywords: ["shell", "esso", "bp ", "texaco", "total", "tankstation"],
      },

      // Insurance
      "health-insurance": {
        keywords: ["menzis", "zilveren kruis", "cz", "vgz", "zorgverzekering"],
        amountRange: { min: 50, max: 500 },
      },
      insurance: {
        keywords: [
          "verzekering",
          "insurance",
          "monuta",
          "asr",
          "nn schadeverzekering",
        ],
      },

      // Shopping
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
          "action",
          "hema",
        ],
      },

      // Entertainment
      subscriptions: {
        keywords: ["netflix", "spotify", "disney", "flitsmeister"],
        amountRange: { max: 50 },
      },
      entertainment: {
        keywords: [
          "bioscoop",
          "pathe",
          "fitness",
          "sportschool",
          "kart",
          "teamsport",
        ],
      },

      // Financial
      "loan-payment": {
        keywords: ["loan", "lening", "afbetaling", "student debt", "studie"],
        amountRange: { min: 50 },
      },
      "bank-fees": {
        keywords: ["oranjepakket", "kosten", "bank fee"],
        amountRange: { max: 50 },
      },

      // Personal Transfers
      "personal-transfer": {
        keywords: ["manuputty", "vriend", "friend", "loan to", "lend"],
        amountRange: { min: 20 },
      },
    };
  }

  /**
   * Build recurring patterns
   */
  private buildRecurringPatterns() {
    // This would be used for additional pattern matching if needed
    return [];
  }
}

// Export singleton instance
export const importServiceV2 = new ImportServiceV2();
