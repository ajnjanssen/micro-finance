# NASA 50-Line Rule Refactoring Plan

## Current State Analysis

### Files > 400 Lines (Critical)
1. **settings/page.tsx** - 2002 lines 🔴
2. **settings/page-complete.tsx** - 1097 lines 🔴
3. **Onboarding.tsx** - 905 lines 🔴
4. **categories/page.tsx** - 858 lines 🔴
5. **import-service-v2.ts** - 854 lines 🔴
6. **spaardoelen/page.tsx** - 736 lines 🔴
7. **categorize/page.tsx** - 720 lines 🔴
8. **configure/page.tsx** - 648 lines 🔴
9. **SavingsGoals.tsx** - 615 lines 🔴
10. **Dashboard.tsx** - 586 lines 🔴
11. **financial-data.ts** - 545 lines 🔴
12. **finance-v2.ts** - 498 lines 🔴
13. **Budget503020.tsx** - 498 lines 🔴
14. **BudgetPlanner.tsx** - 484 lines 🔴
15. **transaction-validator.ts** - 441 lines 🔴
16. **budget-service.ts** - 411 lines 🔴
17. **projection-engine-v3.ts** - 387 lines 🔴

## Refactoring Strategy

### Phase 1: Type Extraction (2-3 files)
Move all interfaces/types to dedicated type files (max 50 lines each)

**Files to create:**
- `src/types/budget.types.ts` - Budget-related interfaces
- `src/types/transaction.types.ts` - Transaction interfaces
- `src/types/service.types.ts` - Service return types
- `src/types/component.types.ts` - Component prop types

### Phase 2: Service Decomposition (8-10 files)
Break services into focused, single-responsibility modules

**budget-service.ts → split into:**
- `src/services/budget/calculator.ts` - 50/30/20 calculations
- `src/services/budget/categorizer.ts` - Expense categorization
- `src/services/budget/breakdown.ts` - Budget breakdown logic
- `src/services/budget/index.ts` - Exports (facade pattern)

**transaction-service.ts → split into:**
- `src/services/transactions/filters.ts` - Filtering operations
- `src/services/transactions/aggregator.ts` - Aggregation logic
- `src/services/transactions/calculator.ts` - Calculations
- `src/services/transactions/index.ts` - Exports

**category-service.ts → split into:**
- `src/services/categories/normalizer.ts` - Category normalization
- `src/services/categories/classifier.ts` - Classification logic
- `src/services/categories/detector.ts` - Detection patterns
- `src/services/categories/index.ts` - Exports

### Phase 3: Component Decomposition (20-30 files)
Break large components into smaller, focused sub-components

**Dashboard.tsx → split into:**
- `src/components/dashboard/Header.tsx` - Title and actions
- `src/components/dashboard/BalanceCard.tsx` - Current balance display
- `src/components/dashboard/ChartSection.tsx` - Chart container
- `src/components/dashboard/SummaryCards.tsx` - Metric cards
- `src/components/dashboard/index.tsx` - Main composition

**Budget503020.tsx → split into:**
- `src/components/budget/BudgetHeader.tsx` - Title and info
- `src/components/budget/CategorySection.tsx` - Needs/Wants/Savings
- `src/components/budget/ProgressBar.tsx` - Progress visualization
- `src/components/budget/ItemList.tsx` - Budget item list
- `src/components/budget/index.tsx` - Main composition

**BudgetPlanner.tsx → split into:**
- `src/components/planner/FilterControls.tsx` - Month/goal selectors
- `src/components/planner/SummaryCards.tsx` - Total budgeted/spent
- `src/components/planner/CategoryCard.tsx` - Individual category
- `src/components/planner/UnmappedAlert.tsx` - Unmapped categories
- `src/components/planner/index.tsx` - Main composition

### Phase 4: Page Decomposition (10-15 files)

**settings/page.tsx (2002 lines!) → split into:**
- `src/app/settings/components/AccountsSection.tsx` - Account management
- `src/app/settings/components/CategoriesSection.tsx` - Category management
- `src/app/settings/components/TransactionsSection.tsx` - Transaction management
- `src/app/settings/components/ImportExportSection.tsx` - Import/export
- `src/app/settings/page.tsx` - Composition (< 50 lines)

### Phase 5: Remove Unused Code
- Remove `page-complete.tsx.bak`, `page-incomplete.tsx.bak`, `page-old.tsx.bak`
- Remove unused imports
- Remove duplicate/deprecated files

## Benefits

1. **Readability**: Each file has single, clear purpose
2. **Testability**: Easier to test small, focused units
3. **Maintainability**: Changes isolated to specific files
4. **Reusability**: Small components easier to reuse
5. **Performance**: Better tree-shaking, smaller bundles
6. **Collaboration**: Less merge conflicts

## NASA Power of Ten Rules Applied

1. ✅ Restrict to simple control flow (no goto, recursion limits)
2. ✅ All loops have fixed upper bounds
3. ✅ No dynamic memory after initialization
4. ✅ Functions should be short (≤50 lines)
5. ✅ Use assertions for defensive programming
6. ✅ Declare data at smallest scope
7. ✅ Check return values
8. ✅ Limit preprocessor use
9. ✅ Restrict pointer use
10. ✅ Compile with all warnings, zero warnings policy
