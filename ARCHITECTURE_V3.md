# 🏗️ Robust Financial System - Architecture v3.0

## Problem with Current Approach

❌ Trying to **detect** recurring patterns from CSV → unreliable
❌ Projections based on **detected** data → inaccurate
❌ No clear separation between historical data and configuration

## New Clean Architecture

### 1. **CSV Import = Historical Data Only**

```
Purpose: Import transactions for historical analysis
Use: View past spending, categorize, learn patterns
NOT FOR: Projections, recurring detection
```

### 2. **Manual Configuration = Source of Truth**

```typescript
// User explicitly configures:
- Monthly Income: €2,800 (salary)
- Recurring Expenses:
  * Rent: €727.33/month
  * Insurance: €120/month
  * OV-chipkaart: €20/month
  * Netflix: €12/month
  etc.
```

### 3. **Projections = Configuration Based**

```
Current Balance: €350.92
+ Monthly Income: €2,800
- Monthly Expenses: €1,200 (configured)
= Expected next month: €1,950.92
```

---

## Data Structure

### A. Historical Transactions (from CSV)

```typescript
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: TransactionCategory;
  accountId: string;
  tags: string[];
  notes?: string;
  // NO recurring flags here!
}
```

### B. Configuration (user-defined)

```typescript
interface FinancialConfig {
  incomeSources: IncomeSource[];
  recurringExpenses: RecurringExpense[];
  oneTimeExpenses: OneTimeExpense[];
  savingsGoals: SavingsGoal[];
  startingBalance: {
    checking: number;
    savings: number;
    date: string;
  };
}

interface IncomeSource {
  id: string;
  name: string; // "Salary - EXACT CLOUD"
  amount: number; // 2800
  frequency: "monthly" | "weekly" | "yearly";
  dayOfMonth?: number; // 23 (salary comes on 23rd)
  startDate: string;
  endDate?: string; // if temporary
  isActive: boolean;
}

interface RecurringExpense {
  id: string;
  name: string; // "Rent - Patrimonium"
  category: TransactionCategory;
  amount: number; // 727.33
  frequency: "monthly" | "weekly" | "yearly";
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  isEssential: boolean; // can't reduce
  isVariable: boolean; // amount varies
}

interface OneTimeExpense {
  id: string;
  name: string;
  category: TransactionCategory;
  amount: number;
  date: string;
  isPaid: boolean;
}
```

---

## Workflow

### Phase 1: Setup

1. ✅ Import CSV (historical data)
2. ✅ Set starting balance
3. ⚙️ **Configure income sources** (manual)
4. ⚙️ **Configure recurring expenses** (manual)
5. ⚙️ **Configure one-time expenses** (optional)

### Phase 2: Projections

```typescript
function calculateProjection(months: number): Projection[] {
  const config = getConfig();
  const projections = [];

  let balance = getCurrentBalance();

  for (let i = 0; i < months; i++) {
    const month = addMonths(today, i);

    // Add configured income
    const monthlyIncome = config.incomeSources
      .filter((s) => s.isActive && occursInMonth(s, month))
      .reduce((sum, s) => sum + s.amount, 0);

    // Subtract configured expenses
    const monthlyExpenses = config.recurringExpenses
      .filter((e) => e.isActive && occursInMonth(e, month))
      .reduce((sum, e) => sum + e.amount, 0);

    // Subtract one-time expenses
    const oneTime = config.oneTimeExpenses
      .filter((e) => !e.isPaid && isInMonth(e.date, month))
      .reduce((sum, e) => sum + e.amount, 0);

    balance += monthlyIncome - monthlyExpenses - oneTime;

    projections.push({
      month: month,
      income: monthlyIncome,
      expenses: monthlyExpenses + oneTime,
      balance: balance,
      confidence: 100, // we know exactly what's configured!
    });
  }

  return projections;
}
```

### Phase 3: Analysis

- Compare actual transactions vs configured expenses
- Identify overspending in categories
- Track "unbudgeted" expenses
- Suggest configuration updates

---

## Benefits

✅ **Predictable**: Projections based on what YOU configure
✅ **Accurate**: No guessing or pattern detection
✅ **Flexible**: Easily add/remove/modify recurring items
✅ **Transparent**: You see exactly what's being calculated
✅ **Reliable**: No more "why is this wrong?" moments

---

## Implementation Plan

### Step 1: Clear Current Mess ✅

- Keep CSV import (historical data only)
- Remove recurring detection from projections

### Step 2: Build Configuration System

- Create configuration data structure
- Build configuration service (CRUD operations)
- Build configuration UI (forms to add income/expenses)

### Step 3: Rebuild Projection Engine

- Pure calculation based on configuration
- Simple, transparent, testable

### Step 4: Build Analysis Tools

- Compare actual vs configured
- Variance reports
- Spending insights

---

## User Experience

### Current Balance

```
Checking: €229.97
Savings: €120.95
Total: €350.92
```

### Configured Income (Monthly)

```
✅ Salary (EXACT CLOUD): €2,800 (23rd of month)
Total: €2,800/month
```

### Configured Expenses (Monthly)

```
🏠 Rent (Patrimonium): €727.33
🚌 Transport (OV-chipkaart): €20
📺 Netflix: €12
💳 Insurance: €120
...
Total: €1,200/month (example)
```

### Projection

```
Current: €350.92
Next month: €350.92 + €2,800 - €1,200 = €1,950.92
Month after: €1,950.92 + €2,800 - €1,200 = €3,550.92
...
```

**Crystal clear, no surprises!** ✨

---

## Ready to build this?

Next steps:

1. Create configuration data structure
2. Build configuration service
3. Build simple configuration UI
4. Rebuild projection engine (clean calculation)

This will actually WORK and be maintainable! 🚀
