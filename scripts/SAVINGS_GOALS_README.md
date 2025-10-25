# Savings Goals Scripts

This folder contains scripts for managing savings goals and linking transactions.

## Available Scripts

### 1. `add-savings-transaction.ts`
Adds a recurring €500 monthly savings transaction linked to your first savings goal.

```bash
npx tsx scripts/add-savings-transaction.ts
```

**What it does:**
- Creates a monthly recurring transaction for €500
- Links it to your savings account
- Automatically connects it to your first savings goal
- Uses the "Sparen" category

### 2. `link-savings-to-goal.ts`
Links existing savings transactions to a specific savings goal.

```bash
npx tsx scripts/link-savings-to-goal.ts
```

**What it does:**
- Finds all transactions in the "Sparen" category
- Links them to the first savings goal
- Calculates total amount saved

## How Savings Goals Work

### Progress Tracking
- Progress is calculated automatically based on linked transactions
- The `savingsGoalId` field on transactions links them to goals
- Total saved = sum of all linked transaction amounts

### Monthly Contributions
- Set the `monthlyContribution` field on your goal
- The system calculates estimated completion date
- Shows if you're on track to meet your deadline

### Linking Transactions
1. Create a transaction (or use recurring transactions)
2. Add the `savingsGoalId` field to link it to a goal
3. Progress updates automatically

### Example Transaction
```json
{
  "description": "Maandelijks Sparen",
  "amount": 500,
  "categoryId": "cat-xxx-sparen",
  "accountId": "acc-xxx-savings",
  "isRecurring": true,
  "recurringType": "monthly",
  "savingsGoalId": "goal-xxx-motorcycle"
}
```

## Manual Linking

To manually link a transaction to a goal:

1. Find the transaction ID in `data/financial-data.json`
2. Find the goal ID in `data/savings-goals.json`
3. Add `"savingsGoalId": "your-goal-id"` to the transaction
4. Save the file
5. Refresh the app

## Tips

- **Multiple Goals**: Create separate transactions for each goal
- **One-time Savings**: Create non-recurring transactions linked to a goal
- **Change Goals**: Update the `savingsGoalId` to move savings between goals
- **Track History**: All linked transactions are visible in the "Bekijk transacties" modal
