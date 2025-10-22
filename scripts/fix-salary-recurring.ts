/**
 * Fix Salary Recurring Detection
 * Manually mark large EXACT CLOUD DEVELOPMENT transactions as recurring monthly salary
 */

import fs from "node:fs";
import path from "node:path";

const dataPath = path.join(process.cwd(), "data", "financial-data.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

console.log("\n💼 Fixing Salary Recurring Detection\n");

// Find all EXACT CLOUD DEVELOPMENT transactions
const exactCloud = data.transactions.filter(
  (t: any) =>
    t.description.includes("EXACT CLOUD DEVELOPMENT") &&
    t.amount > 0 &&
    t.category === "salary"
);

console.log(
  `Found ${exactCloud.length} EXACT CLOUD DEVELOPMENT salary transactions`
);

// Separate large (actual salary) from small (other payments)
const largeSalary = exactCloud.filter((t: any) => t.amount > 1000);
const smallPayments = exactCloud.filter((t: any) => t.amount <= 1000);

console.log(`  - Large salary (>€1000): ${largeSalary.length} transactions`);
console.log(
  `  - Small payments (≤€1000): ${smallPayments.length} transactions\n`
);

// Mark large salary as recurring
let updated = 0;
for (const tx of data.transactions) {
  if (
    tx.description.includes("EXACT CLOUD DEVELOPMENT") &&
    tx.amount > 1000 &&
    tx.category === "salary"
  ) {
    tx.isRecurring = true;
    tx.recurringType = "monthly";
    tx.recurringConfidence = 95;
    updated++;
  }
}

// Also mark Patrimonium rent as recurring if not already
const patrimonium = data.transactions.filter(
  (t: any) => t.description.includes("Patrimonium") && t.amount < 0
);

for (const tx of data.transactions) {
  if (tx.description.includes("Patrimonium") && tx.amount < 0) {
    tx.isRecurring = true;
    tx.recurringType = "monthly";
    tx.recurringConfidence = 95;
    updated++;
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log(`✅ Updated ${updated} transactions to recurring\n`);

// Show summary
const recurringIncome = data.transactions
  .filter(
    (t: any) => t.isRecurring && t.amount > 0 && t.recurringType === "monthly"
  )
  .reduce((sum: number, t: any) => sum + t.amount, 0);

const recurringExpenses = data.transactions
  .filter(
    (t: any) => t.isRecurring && t.amount < 0 && t.recurringType === "monthly"
  )
  .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

console.log("📊 Recurring Monthly Summary:");
console.log(
  `   Income: €${(recurringIncome / largeSalary.length).toFixed(2)}/month (avg)`
);
console.log(
  `   Expenses: €${(recurringExpenses / patrimonium.length).toFixed(
    2
  )}/month (avg)`
);
console.log(
  `   Net: €${(
    recurringIncome / largeSalary.length -
    recurringExpenses / patrimonium.length
  ).toFixed(2)}/month\n`
);
