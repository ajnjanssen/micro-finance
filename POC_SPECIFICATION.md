# 🚀 Micro Finance v2.0 - Proof of Concept Specification

## 🎯 Core Objective

**Build a focused financial dashboard that:**

1. ✅ Imports your CSV data automatically
2. ✅ Auto-categorizes transactions intelligently
3. ✅ Allows manual corrections (especially recurring transactions)
4. ✅ Configures expenses, income, loans, debt, tax
5. ✅ Shows realistic projections based on YOUR actual data

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    1. DATA IMPORT                           │
│  User uploads CSV → Parse → Validate → Auto-categorize     │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                2. REVIEW & CORRECT                          │
│  User reviews → Fixes categories → Marks recurring         │
│  Configures → Loans, Debts, Tax rates, Income sources      │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              3. INTELLIGENT ANALYSIS                        │
│  System calculates → Trends, Patterns, Projections          │
│  Applies config → Interest, Tax, Debt repayment             │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              4. VISUAL DASHBOARD                            │
│  Shows → Current state, Future projections, Growth/Loss     │
│  Interactive → What-if scenarios, Budget planning           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ New Architecture (Clean Slate)

### 1. Enhanced Data Model

```typescript
// src/types/finance-v2.ts

// ============= CORE ENTITIES =============

interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "investment" | "credit-card";
  balance: number;
  currency: "EUR" | "USD";
  institution?: string;
  accountNumber?: string;
}

interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // Signed: + income, - expense

  // Categorization
  category: TransactionCategory;
  subcategory?: string;
  autoCategorizationConfidence: number; // 0-100
  manuallyReviewed: boolean;

  // Recurring detection
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  recurringGroupId?: string; // Links related recurring transactions

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
}

type TransactionCategory =
  | "salary"
  | "bonus"
  | "investment-income"
  | "housing"
  | "utilities"
  | "groceries"
  | "dining"
  | "transport"
  | "insurance"
  | "healthcare"
  | "entertainment"
  | "shopping"
  | "education"
  | "savings-transfer"
  | "loan-payment"
  | "tax-payment"
  | "other-income"
  | "other-expense";

interface RecurringPattern {
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  expectedAmount: number;
  tolerance: number; // Amount variance tolerance (%)
  nextExpectedDate: string;
  confidence: number; // 0-100, based on history
}

// ============= CONFIGURATION =============

interface IncomeSource {
  id: string;
  name: string;
  type: "salary" | "freelance" | "investment" | "rental" | "business" | "other";
  employer?: string;
  amount: number; // Monthly expected
  frequency: "monthly" | "biweekly" | "weekly";
  taxable: boolean;
  startDate: string;
  endDate?: string; // null if ongoing
  confidence: "confirmed" | "estimated";
}

interface RecurringExpense {
  id: string;
  name: string;
  category: TransactionCategory;
  amount: number;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  dayOfMonth?: number; // For monthly (1-31)
  dayOfWeek?: number; // For weekly (0-6)
  isEssential: boolean; // Rent, utilities = true; Entertainment = false
  canReduce: boolean; // User-defined: can this be reduced?
  reductionPotential?: number; // % that could be reduced
  linkedTransactionIds: string[]; // Historical transactions
  startDate: string;
  endDate?: string;
}

interface Loan {
  id: string;
  name: string;
  type: "mortgage" | "student" | "personal" | "auto" | "credit-card";
  lender: string;

  // Loan details
  originalAmount: number;
  currentBalance: number;
  interestRate: number; // Annual %
  termMonths: number;
  monthlyPayment: number;

  // Dates
  startDate: string;
  firstPaymentDate: string;
  maturityDate: string;

  // Status
  status: "active" | "paid-off" | "deferred";

  // Linked
  accountId?: string;
  linkedTransactionIds: string[];
}

interface TaxConfiguration {
  id: string;
  country: "NL" | "US" | "UK"; // Expand as needed
  year: number;

  // Income tax
  incomeTaxBrackets: TaxBracket[];
  standardDeduction: number;

  // Dutch-specific
  taxCredits: TaxCredit[];
  socialSecurityRate: number; // e.g., 27.65% in NL

  // User-specific
  filingStatus: "single" | "married" | "head-of-household";
  dependents: number;

  // Deductions
  mortgageInterestDeduction: boolean;
  charitableDeductions: number;
  businessExpenses: number;
}

interface TaxBracket {
  min: number;
  max: number | null; // null = no upper limit
  rate: number; // %
}

interface TaxCredit {
  name: string;
  amount: number;
  description: string;
}

// ============= PROJECTIONS =============

interface FinancialProjection {
  date: string; // End of month

  // Balances
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;

  // Cash flow
  expectedIncome: number;
  expectedExpenses: number;
  expectedNetCashFlow: number;

  // Breakdown
  accountBalances: { [accountId: string]: number };
  loanBalances: { [loanId: string]: number };

  // Confidence
  confidence: "high" | "medium" | "low"; // Based on data quality
  factors: string[]; // What influenced this projection
}

interface WhatIfScenario {
  id: string;
  name: string;
  description: string;

  changes: ScenarioChange[];

  // Results
  baselineProjection: FinancialProjection[];
  scenarioProjection: FinancialProjection[];

  // Summary
  totalImpact: number; // Over scenario period
  breakEvenMonth?: string;
  recommendation?: string;
}

interface ScenarioChange {
  type:
    | "reduce-expense"
    | "eliminate-expense"
    | "add-income"
    | "pay-off-debt"
    | "increase-savings";
  targetId: string; // RecurringExpense ID, Loan ID, etc.
  percentChange?: number;
  fixedChange?: number;
  startMonth: string;
  endMonth?: string;
}

// ============= MAIN DATA STORE =============

interface FinancialData {
  // Core
  accounts: Account[];
  transactions: Transaction[];

  // Configuration
  incomeSources: IncomeSource[];
  recurringExpenses: RecurringExpense[];
  loans: Loan[];
  taxConfig: TaxConfiguration;

  // Analysis
  projections: FinancialProjection[];
  scenarios: WhatIfScenario[];

  // Metadata
  lastImportDate: string;
  lastAnalysisDate: string;
  dataQualityScore: number; // 0-100
  version: string;
}
```

---

## 🛠️ Core Services

### 1. Import Service (Enhanced)

```typescript
// src/services/import-service.ts

class ImportService {
  /**
   * Main import pipeline
   */
  async importCSV(file: File): Promise<ImportResult> {
    // 1. Parse CSV
    const rows = await this.parseCSV(file);

    // 2. Convert to transactions
    const transactions = await this.convertToTransactions(rows);

    // 3. Auto-categorize
    const categorized = await this.autoCategorize(transactions);

    // 4. Detect recurring patterns
    const withRecurring = await this.detectRecurringPatterns(categorized);

    // 5. Link to existing data
    const linked = await this.linkToExistingData(withRecurring);

    // 6. Generate import report
    const report = this.generateImportReport(linked);

    return {
      transactions: linked,
      report,
      needsReview: linked.filter((t) => t.autoCategorizationConfidence < 80),
    };
  }

  /**
   * Smart categorization with confidence scoring
   */
  async autoCategorize(transactions: Transaction[]): Promise<Transaction[]> {
    return transactions.map((tx) => {
      const result = this.matchCategory(tx);
      return {
        ...tx,
        category: result.category,
        subcategory: result.subcategory,
        autoCategorizationConfidence: result.confidence,
        manuallyReviewed: false,
      };
    });
  }

  /**
   * Advanced recurring detection
   */
  async detectRecurringPatterns(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    // Group by similar description and amount
    const groups = this.groupSimilarTransactions(transactions);

    // Analyze each group for patterns
    const patterns = groups.map((group) => this.analyzePattern(group));

    // Mark transactions with detected patterns
    return this.markRecurring(transactions, patterns);
  }

  /**
   * Generate configuration from imported data
   */
  async extractConfiguration(transactions: Transaction[]): Promise<{
    incomeSources: IncomeSource[];
    recurringExpenses: RecurringExpense[];
    suggestedLoans: Loan[];
  }> {
    // Detect income sources
    const incomeSources = this.detectIncomeSources(transactions);

    // Detect recurring expenses
    const recurringExpenses = this.detectRecurringExpenses(transactions);

    // Suggest potential loans (large regular payments)
    const suggestedLoans = this.detectPotentialLoans(transactions);

    return { incomeSources, recurringExpenses, suggestedLoans };
  }
}

interface ImportResult {
  transactions: Transaction[];
  report: ImportReport;
  needsReview: Transaction[];
}

interface ImportReport {
  totalImported: number;
  categorized: number;
  needsReview: number;
  duplicatesSkipped: number;
  dateRange: { start: string; end: string };
  categoryBreakdown: { [category: string]: number };
  recurringDetected: number;
  confidenceDistribution: {
    high: number; // 80-100%
    medium: number; // 50-79%
    low: number; // 0-49%
  };
}
```

### 2. Configuration Service

```typescript
// src/services/config-service.ts

class ConfigurationService {
  /**
   * Review and approve auto-detected configuration
   */
  async reviewConfiguration(): Promise<ConfigReview> {
    const data = await this.loadData();

    return {
      incomeSources: {
        detected: data.incomeSources,
        needsConfirmation: data.incomeSources.filter(
          (s) => s.confidence === "estimated"
        ),
        suggestions: [],
      },
      recurringExpenses: {
        detected: data.recurringExpenses,
        needsConfirmation: data.recurringExpenses.filter(
          (e) => !e.linkedTransactionIds.length
        ),
        suggestions: [],
      },
      loans: {
        detected: data.loans,
        needsConfirmation: data.loans.filter(
          (l) => !l.linkedTransactionIds.length
        ),
        suggestions: [],
      },
    };
  }

  /**
   * Configure tax settings
   */
  async configureTax(
    config: Partial<TaxConfiguration>
  ): Promise<TaxConfiguration> {
    // Validate tax configuration
    // Apply to financial data
    // Recalculate projections with tax impact
  }

  /**
   * Mark transaction as recurring (manual override)
   */
  async markAsRecurring(
    transactionId: string,
    pattern: RecurringPattern
  ): Promise<void> {
    // Update transaction
    // Create/update recurring expense configuration
    // Recalculate projections
  }

  /**
   * Update expense reducibility (for what-if scenarios)
   */
  async updateExpenseFlexibility(
    expenseId: string,
    canReduce: boolean,
    reductionPotential: number
  ): Promise<void> {
    // Update configuration
    // Recalculate scenario possibilities
  }
}
```

### 3. Projection Engine

```typescript
// src/services/projection-engine.ts

class ProjectionEngine {
  /**
   * Generate comprehensive financial projections
   */
  async generateProjections(
    monthsAhead: number = 36
  ): Promise<FinancialProjection[]> {
    const data = await this.loadData();
    const projections: FinancialProjection[] = [];

    // Get current state
    let currentState = await this.getCurrentFinancialState();

    for (let i = 1; i <= monthsAhead; i++) {
      const projectionDate = this.addMonths(new Date(), i);

      // Calculate expected income
      const income = this.projectIncome(data.incomeSources, projectionDate);

      // Calculate expected expenses
      const expenses = this.projectExpenses(
        data.recurringExpenses,
        projectionDate
      );

      // Calculate loan payments
      const loanPayments = this.projectLoanPayments(data.loans, projectionDate);

      // Calculate taxes
      const taxes = this.estimateTaxes(income, data.taxConfig, projectionDate);

      // Calculate net cash flow
      const netCashFlow = income - expenses - loanPayments - taxes;

      // Update balances
      currentState = this.updateState(currentState, netCashFlow, data.loans);

      // Store projection
      projections.push({
        date: this.formatDate(projectionDate),
        totalAssets: currentState.totalAssets,
        totalLiabilities: currentState.totalLiabilities,
        netWorth: currentState.netWorth,
        expectedIncome: income,
        expectedExpenses: expenses + loanPayments + taxes,
        expectedNetCashFlow: netCashFlow,
        accountBalances: currentState.accountBalances,
        loanBalances: currentState.loanBalances,
        confidence: this.calculateConfidence(data, i),
        factors: this.identifyFactors(data, i),
      });
    }

    return projections;
  }

  /**
   * Calculate loan amortization
   */
  private projectLoanPayments(loans: Loan[], date: Date): number {
    return loans
      .filter((loan) => loan.status === "active")
      .filter((loan) => new Date(loan.firstPaymentDate) <= date)
      .filter((loan) => new Date(loan.maturityDate) >= date)
      .reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  }

  /**
   * Estimate taxes based on income and configuration
   */
  private estimateTaxes(
    annualIncome: number,
    taxConfig: TaxConfiguration,
    date: Date
  ): number {
    // Apply tax brackets
    let taxableIncome = annualIncome - taxConfig.standardDeduction;
    let totalTax = 0;

    for (const bracket of taxConfig.incomeTaxBrackets) {
      if (taxableIncome <= 0) break;

      const taxableInBracket = bracket.max
        ? Math.min(taxableIncome, bracket.max - bracket.min)
        : taxableIncome;

      totalTax += taxableInBracket * (bracket.rate / 100);
      taxableIncome -= taxableInBracket;
    }

    // Add social security
    totalTax += annualIncome * (taxConfig.socialSecurityRate / 100);

    // Apply credits
    totalTax -= taxConfig.taxCredits.reduce(
      (sum, credit) => sum + credit.amount,
      0
    );

    // Return monthly portion
    return totalTax / 12;
  }

  /**
   * Calculate projection confidence based on data quality
   */
  private calculateConfidence(
    data: FinancialData,
    monthsAhead: number
  ): "high" | "medium" | "low" {
    const hasEnoughHistory = data.transactions.length > 100;
    const hasConfirmedIncome = data.incomeSources.every(
      (s) => s.confidence === "confirmed"
    );
    const hasConfirmedExpenses = data.recurringExpenses.length > 5;

    if (
      monthsAhead <= 6 &&
      hasEnoughHistory &&
      hasConfirmedIncome &&
      hasConfirmedExpenses
    ) {
      return "high";
    } else if (monthsAhead <= 12 && hasEnoughHistory) {
      return "medium";
    } else {
      return "low";
    }
  }
}
```

### 4. Scenario Service

```typescript
// src/services/scenario-service.ts

class ScenarioService {
  /**
   * Create what-if scenario
   */
  async createScenario(
    name: string,
    description: string,
    changes: ScenarioChange[]
  ): Promise<WhatIfScenario> {
    // Get baseline projections
    const baseline = await projectionEngine.generateProjections(36);

    // Apply scenario changes
    const modifiedData = this.applyChanges(changes);

    // Generate scenario projections
    const scenarioProjections = await projectionEngine.generateProjections(
      36,
      modifiedData
    );

    // Calculate impact
    const totalImpact = this.calculateTotalImpact(
      baseline,
      scenarioProjections
    );
    const breakEven = this.findBreakEvenPoint(baseline, scenarioProjections);

    return {
      id: generateId(),
      name,
      description,
      changes,
      baselineProjection: baseline,
      scenarioProjection: scenarioProjections,
      totalImpact,
      breakEvenMonth: breakEven,
      recommendation: this.generateRecommendation(totalImpact, breakEven),
    };
  }

  /**
   * Common scenario: Reduce dining/entertainment
   */
  async simulateExpenseReduction(
    category: TransactionCategory,
    percentReduction: number
  ): Promise<WhatIfScenario> {
    const expense = await this.findRecurringExpense(category);

    return this.createScenario(
      `Reduce ${category} by ${percentReduction}%`,
      `What if you reduced spending on ${category} by ${percentReduction}%?`,
      [
        {
          type: "reduce-expense",
          targetId: expense.id,
          percentChange: -percentReduction,
          startMonth: this.getCurrentMonth(),
        },
      ]
    );
  }

  /**
   * Common scenario: Pay off debt early
   */
  async simulateDebtPayoff(
    loanId: string,
    extraPayment: number
  ): Promise<WhatIfScenario> {
    // Complex calculation showing interest saved and time reduced
  }
}
```

---

## 🎨 UI Components (Proof of Concept)

### Page 1: Import & Review

```typescript
// src/app/import/page.tsx

export default function ImportPage() {
  return (
    <div>
      {/* Step 1: Upload */}
      <UploadCSV onUpload={handleUpload} />

      {/* Step 2: Review import results */}
      <ImportSummary report={importReport} />

      {/* Step 3: Review transactions needing attention */}
      <TransactionReviewList
        transactions={needsReview}
        onApprove={handleApprove}
        onEdit={handleEdit}
      />

      {/* Step 4: Confirm configuration */}
      <ConfigurationReview
        incomeSources={detectedIncome}
        recurringExpenses={detectedExpenses}
        loans={detectedLoans}
        onConfirm={handleConfirmConfig}
      />
    </div>
  );
}
```

### Page 2: Configuration Dashboard

```typescript
// src/app/configure/page.tsx

export default function ConfigurePage() {
  return (
    <div className="grid gap-6">
      {/* Income Sources */}
      <ConfigSection title="Income Sources">
        <IncomeSourceList
          sources={incomeSources}
          onEdit={handleEditIncome}
          onAdd={handleAddIncome}
        />
      </ConfigSection>

      {/* Recurring Expenses */}
      <ConfigSection title="Recurring Expenses">
        <RecurringExpenseList
          expenses={recurringExpenses}
          onEdit={handleEditExpense}
          onMarkEssential={handleMarkEssential}
          onSetReductionPotential={handleSetReduction}
        />
      </ConfigSection>

      {/* Loans & Debt */}
      <ConfigSection title="Loans & Debt">
        <LoanList loans={loans} onEdit={handleEditLoan} onAdd={handleAddLoan} />
      </ConfigSection>

      {/* Tax Configuration */}
      <ConfigSection title="Tax Settings">
        <TaxConfigForm config={taxConfig} onChange={handleTaxUpdate} />
      </ConfigSection>
    </div>
  );
}
```

### Page 3: Financial Dashboard (The Main View)

```typescript
// src/app/dashboard/page.tsx

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Current State */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Net Worth"
          value={netWorth}
          trend={trend}
          icon="💰"
        />
        <MetricCard
          title="Monthly Income"
          value={monthlyIncome}
          subtitle="After tax"
        />
        <MetricCard
          title="Monthly Expenses"
          value={monthlyExpenses}
          subtitle="All recurring"
        />
        <MetricCard
          title="Monthly Savings"
          value={monthlySavings}
          trend={savingsTrend}
        />
      </div>

      {/* Projections Chart */}
      <Card>
        <h2>36-Month Projection</h2>
        <ProjectionChart
          projections={projections}
          showIncome
          showExpenses
          showNetWorth
        />
      </Card>

      {/* What-If Scenarios */}
      <Card>
        <h2>What-If Scenarios</h2>
        <ScenarioComparison scenarios={scenarios} />
        <Button onClick={handleCreateScenario}>Create New Scenario</Button>
      </Card>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <h3>Income Breakdown</h3>
          <PieChart data={incomeBreakdown} />
        </Card>
        <Card>
          <h3>Expense Breakdown</h3>
          <PieChart data={expenseBreakdown} />
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <h2>Key Insights</h2>
        <InsightsList insights={insights} />
      </Card>
    </div>
  );
}
```

---

## 🚀 Implementation Plan (Proof of Concept)

### Week 1: Foundation

- [ ] Create new data model (finance-v2.ts)
- [ ] Build enhanced import service
- [ ] Create import/review page
- [ ] Test with your real CSV data

### Week 2: Configuration

- [ ] Build configuration service
- [ ] Create configuration dashboard
- [ ] Implement manual corrections UI
- [ ] Link to imported transactions

### Week 3: Projections

- [ ] Build projection engine
- [ ] Implement tax calculations
- [ ] Create projection visualization
- [ ] Add confidence indicators

### Week 4: Scenarios & Polish

- [ ] Build scenario service
- [ ] Create what-if simulator UI
- [ ] Add charts and visualizations
- [ ] Final testing with real data

---

## ✅ Success Criteria

**The proof of concept is successful when:**

1. ✅ You can upload your real CSV files
2. ✅ System auto-categorizes with >80% accuracy
3. ✅ You can review and correct any mistakes
4. ✅ You can configure income, expenses, loans, tax
5. ✅ Dashboard shows realistic 36-month projections
6. ✅ You can simulate "what-if" scenarios
7. ✅ All numbers match your actual financial situation

---

## 🎯 Next Steps

**Should I start building this?**

I can begin with:

1. **Data model** - Create the new type definitions
2. **Import service** - Enhanced CSV import with confidence scoring
3. **Review page** - UI for reviewing and correcting imported data

**Ready to begin?** 🚀
