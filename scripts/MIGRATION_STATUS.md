# 📝 Scripts Directory - Migration Status

## ⚠️ DEPRECATED: CLI Scripts

The `finance-cli.ts` and `lib/transaction-manager.ts` scripts are **no longer needed**.

All functionality has been **integrated into the frontend** via the service layer:

---

## ✅ **What Replaced The CLI**

### **Old Way (Manual CLI)**

```bash
npm run finance -- clean
npm run finance -- recategorize
npm run finance -- balance
```

### **New Way (Automatic Frontend)**

```typescript
// Everything happens automatically when you:
1. Upload CSV via frontend → Validated & categorized
2. Add transaction via form → Validated & categorized
3. View dashboard → Balances calculated
```

---

## 📁 **Current Script Files**

### **✅ ACTIVE: import-csv.ts**

- **Status**: ✅ Updated to use centralized validator
- **Used By**: `/api/upload-csv` route (frontend CSV upload)
- **Purpose**: Parse CSV files and import transactions
- **Features**:
  - Auto-categorization with audit trails
  - Duplicate detection
  - Validation
  - Tag extraction

### **❌ DEPRECATED: finance-cli.ts**

- **Status**: ❌ Not needed (frontend handles this)
- **Replaced By**: API routes + transaction-validator.ts
- **Can Be**: Deleted or kept for emergency manual operations

### **❌ DEPRECATED: lib/transaction-manager.ts**

- **Status**: ❌ Deleted (functionality moved to service layer)
- **Replaced By**: `src/services/transaction-validator.ts`
- **New Location**: All logic now in frontend services

### **⚠️ OLD SCRIPTS (Can Be Deleted)**

All these are replaced by automatic frontend processing:

- `remove-duplicates.ts` → Now automatic in addTransaction()
- `recategorize-all.ts` → Happens on import/add automatically
- `mark-recurring.ts` → Happens on import/add automatically
- `check-balance.ts` → Dashboard calculates this
- `set-starting-balance.ts` → Can add via frontend form
- `maintain-data.ts` → No longer needed
- `fix-*.ts` → Were one-time fixes
- `check-*.ts` → Dashboard shows this data

---

## 🎯 **Core Module Location**

### **⭐ src/services/transaction-validator.ts**

**This is the single source of truth** for:

- ✅ Categorization rules (with audit trails)
- ✅ Recurring detection patterns
- ✅ Tag extraction
- ✅ Validation logic
- ✅ Duplicate checking

Used by:

- `src/services/financial-data.ts` (for manual adds)
- `scripts/import-csv.ts` (for CSV imports)
- Future: Any other service that needs validation

---

## 🔄 **Data Flow**

```
Frontend Upload/Form
        ↓
API Route (/api/upload-csv or /api/finance)
        ↓
Service Layer (financial-data.ts or import-csv.ts)
        ↓
⭐ transaction-validator.ts ⭐
        ↓
Data saved with validation + categorization + audit trails
```

---

## 📝 **Cleanup Recommendations**

### **Safe to Delete:**

```
scripts/finance-cli.ts
scripts/remove-duplicates.ts
scripts/recategorize-all.ts
scripts/mark-recurring.ts
scripts/check-balance.ts
scripts/set-starting-balance.ts
scripts/maintain-data.ts
scripts/fix-*.ts
scripts/check-*.ts
scripts/add-demo-*.ts
```

### **Keep:**

```
scripts/import-csv.ts (used by frontend)
```

### **Core Module:**

```
src/services/transaction-validator.ts (NEW - single source of truth)
src/services/financial-data.ts (UPDATED - uses validator)
```

---

## 🎉 **Result**

**You no longer need to run any manual scripts!**

Everything happens automatically through your frontend:

- ✅ Upload CSV → Auto-validated & categorized
- ✅ Add transaction → Auto-validated & categorized
- ✅ View data → Auto-calculated balances
- ✅ Edit transaction → Auto-validated

**No CLI needed. No manual maintenance. Just use your frontend!** 🚀
