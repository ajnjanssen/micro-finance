# Financial Data Scripts

## Active Scripts

### `import-csv.ts`

**Purpose**: Import transactions from CSV files  
**Used By**: Frontend API route `/api/upload-csv`  
**Features**:

- ✅ Automatic validation using `transaction-validator.ts`
- ✅ Intelligent categorization with audit trails
- ✅ Duplicate detection
- ✅ Tag extraction
- ✅ Recurring pattern detection

**Note**: This script is called automatically when you upload a CSV through the frontend. You don't need to run it manually.

---

## Core Validation Module

### `src/services/transaction-validator.ts`

**Single source of truth** for all financial logic:

- ✅ Categorization rules (deterministic, with audit trails)
- ✅ Recurring detection patterns
- ✅ Tag extraction
- ✅ Full validation (dates, amounts, accounts)
- ✅ Duplicate checking

**Used By**:

- `scripts/import-csv.ts` - For CSV imports
- `src/services/financial-data.ts` - For manual transaction entry

---

## Frontend Integration

All data operations now happen automatically through the frontend:

### **CSV Upload**

1. User uploads CSV via UI
2. `/api/upload-csv` saves file
3. `import-csv.ts` processes it
4. `transaction-validator.ts` validates & enriches
5. Data saved with audit trails

### **Manual Transaction Entry**

1. User fills form in UI
2. `/api/finance` receives data
3. `financial-data.ts` processes it
4. `transaction-validator.ts` validates & enriches
5. Data saved with audit trails

---

## Removed Scripts

The following scripts have been **deleted** as they're no longer needed:

- ❌ `finance-cli.ts` - Replaced by frontend integration
- ❌ `remove-duplicates.ts` - Now automatic
- ❌ `recategorize-all.ts` - Now automatic
- ❌ `mark-recurring.ts` - Now automatic
- ❌ `check-balance.ts` - Dashboard shows this
- ❌ `set-starting-balance.ts` - Add via frontend
- ❌ `maintain-data.ts` - No longer needed
- ❌ `fix-*.ts` - One-time fixes (completed)
- ❌ `check-*.ts` - Dashboard shows this data
- ❌ `add-*.ts` - Add via frontend

---

## Customization

### Adding New Categories

Edit `src/services/transaction-validator.ts`:

```typescript
const CATEGORY_RULES: Record<string, CategoryRule> = {
  // ...existing categories...
  healthcare: {
    keywords: ["pharmacy", "doctor", "hospital"],
    type: "expense",
  },
};
```

### Adding Recurring Patterns

Edit `src/services/transaction-validator.ts`:

```typescript
const RECURRING_PATTERNS: RecurringPattern[] = {
  // ...existing patterns...
  {
    keywords: ["gym membership"],
    type: "monthly",
  },
};
```

---

## No Manual Work Needed!

**Everything happens automatically through your frontend UI:**

✅ Upload CSV → Validated & categorized  
✅ Add transaction → Validated & categorized  
✅ View dashboard → Live calculations  
✅ Edit transaction → Re-validated

**No CLI commands needed!** 🎉

**Check current balance**

```bash
npm run finance -- balance
```

**Set starting balance**

```bash
npm run finance -- set-balance 312.75
```

**Show monthly stats**

```bash
npm run finance -- stats 2025-10
```

**Run full maintenance**

```bash
npm run finance -- maintain
```

## Benefits

### 1. Single Source of Truth

- Categorization logic in ONE place
- Recurring detection in ONE place
- No more inconsistencies between scripts

### 2. Robust Error Handling

- Type-safe operations
- Proper validation
- Clear error messages

### 3. Consistent Data Operations

- Duplicate detection uses same key: `description|date|amount`
- All scripts use the same transaction manager
- No more "which script should I run first?"

### 4. Easy to Test

```typescript
import { categorizeTransaction } from "./lib/transaction-manager";

test("categorizes salary correctly", () => {
  const category = categorizeTransaction("EXACT CLOUD DEVELOPMENT", "", 2750);
  expect(category).toBe("salary");
});
```

### 5. Easy to Extend

Want to add a new category?

```typescript
// In transaction-manager.ts
const CATEGORY_RULES = {
  // ... existing rules ...
  healthcare: {
    keywords: ["apotheek", "pharmacy", "hospital"],
    type: "expense",
  },
};
```

Then run:

```bash
npm run finance -- recategorize
```

## Migration Plan

### Phase 1: Keep Old Scripts (✅ DONE)

- New system available
- Old scripts still work
- Both can coexist

### Phase 2: Test New System

```bash
# Test each command
npm run finance -- balance
npm run finance -- stats 2025-10
npm run finance -- maintain
```

### Phase 3: Delete Old Scripts (Optional)

Once you trust the new system:

```bash
rm scripts/remove-duplicates.ts
rm scripts/recategorize-all.ts
rm scripts/mark-recurring.ts
rm scripts/check-balance.ts
rm scripts/set-starting-balance.ts
rm scripts/maintain-data.ts
```

## Scripts to Keep

These scripts have specific purposes not covered by the CLI:

- `import-csv.ts` - CSV import (already updated to use transaction-manager)
- `analyze-spending.ts` - Detailed spending analysis
- `check-monthly-reality.ts` - Month-by-month breakdown
- `add-13th-month.ts` - One-time bonus addition
- `fix-*.ts` - One-time migration scripts (can delete after running)

## Future Improvements

### Add to CLI:

- [ ] Import CSV command
- [ ] Spending analysis command
- [ ] Budget tracking
- [ ] Export to Excel/CSV

### Add to transaction-manager:

- [ ] Category validation
- [ ] Recurring transaction prediction
- [ ] Anomaly detection (unusual expenses)
- [ ] Budget alerts
