/**
 * Fix Starting Balance
 * Remove incorrect starting balances and set correct one based on actual current balance
 */

import fs from "node:fs";
import path from "node:path";

const dataPath = path.join(process.cwd(), "data", "financial-data.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

console.log("\n🔧 Fixing Starting Balance\n");

// Remove all existing starting balance transactions
const oldStarting = data.transactions.filter((t: any) =>
  t.description.includes("Starting Balance")
);
console.log(
  `🗑️  Removing ${oldStarting.length} old starting balance transactions`
);

data.transactions = data.transactions.filter(
  (t: any) => !t.description.includes("Starting Balance")
);

// Calculate net change from all transactions
const netChange = data.transactions.reduce(
  (sum: number, t: any) => sum + t.amount,
  0
);
console.log(`📊 Net change from all transactions: €${netChange.toFixed(2)}`);

// Current actual balance
const currentActual = 229.97 + 120.95; // checking + savings
console.log(`💰 Current actual balance: €${currentActual.toFixed(2)}`);

// Calculate required starting balance
const startingBalance = currentActual - netChange;
console.log(
  `🎯 Required starting balance (Oct 1, 2024): €${startingBalance.toFixed(2)}\n`
);

// Add new starting balance transaction for checking account only
// (since all transactions go through checking)
const newStarting = {
  id: `tx-starting-balance-${Date.now()}`,
  description: "Starting Balance (Oct 1, 2024)",
  amount: startingBalance,
  type: startingBalance >= 0 ? "income" : "expense",
  category: "uncategorized",
  categoryReason: "Calculated starting balance",
  accountId: "checking-1",
  date: "2024-10-01", // BEFORE first transaction
  isRecurring: false,
  tags: ["starting-balance", "calculated"],
  notes: `Calculated to result in €${currentActual.toFixed(2)} current balance`,
  autoCategorizationConfidence: 100,
  categorizationReason: "Manual starting balance",
  manuallyReviewed: true,
  taxDeductible: false,
  importSource: "manual",
  importDate: new Date().toISOString(),
};

data.transactions.unshift(newStarting);

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log("✅ Starting balance fixed!");
console.log(`   Date: 2024-10-01`);
console.log(`   Amount: €${startingBalance.toFixed(2)}`);
console.log(`   Account: checking-1\n`);

console.log("📊 Expected Results:");
console.log(`   Starting: €${startingBalance.toFixed(2)} (Oct 1, 2024)`);
console.log(`   Net change: €${netChange.toFixed(2)} (13 months)`);
console.log(`   Current: €${currentActual.toFixed(2)} (Oct 19, 2025)`);
console.log(`   ✅ Math checks out!\n`);
