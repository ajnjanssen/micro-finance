/**
 * Set starting balance for an account
 * This helps establish the baseline after importing CSV data
 */

import fs from "node:fs";
import path from "node:path";

interface Account {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  accountId: string;
  date: string;
  isRecurring: boolean;
  [key: string]: any;
}

interface FinancialData {
  accounts: Account[];
  transactions: Transaction[];
}

function setStartingBalance(accountId: string, balance: number, date?: string) {
  const dataPath = path.join(process.cwd(), "data", "financial-data.json");

  // Read data
  const data: FinancialData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // Find account
  const account = data.accounts.find((a) => a.id === accountId);
  if (!account) {
    console.error(`❌ Account not found: ${accountId}`);
    console.log("\nAvailable accounts:");
    for (const acc of data.accounts) {
      console.log(`  - ${acc.id}: ${acc.name} (${acc.type})`);
    }
    process.exit(1);
  }

  // Remove existing starting balance transaction
  const existingIndex = data.transactions.findIndex(
    (t) =>
      t.accountId === accountId &&
      t.description.toLowerCase().includes("starting balance")
  );

  if (existingIndex !== -1) {
    console.log(
      `🗑️  Removing existing starting balance: €${data.transactions[existingIndex].amount}`
    );
    data.transactions.splice(existingIndex, 1);
  }

  // Add new starting balance transaction
  const startDate =
    date ||
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0];

  const transaction: Transaction = {
    id: `tx-starting-balance-${Date.now()}`,
    description: "Starting Balance",
    amount: balance,
    type: balance >= 0 ? "income" : "expense",
    category: "uncategorized",
    categoryReason: "Manual starting balance entry",
    accountId,
    date: startDate,
    isRecurring: false,
    tags: ["starting-balance", "manual"],
    notes: `Manual starting balance set on ${new Date().toISOString()}`,
  };

  // Insert at beginning (oldest date)
  data.transactions.unshift(transaction);

  // Save
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  console.log(`\n✅ Starting balance set for ${account.name}`);
  console.log(`   Amount: €${balance.toFixed(2)}`);
  console.log(`   Date: ${startDate}`);
  console.log(`   Transaction ID: ${transaction.id}\n`);
}

// Parse command line args
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage: npx tsx scripts/set-starting-balance-v2.ts <accountId> <balance> [date]

Examples:
  npx tsx scripts/set-starting-balance-v2.ts checking-1 -2255.07
  npx tsx scripts/set-starting-balance-v2.ts savings-1 910.94 2025-01-01

  Set starting balance for checking account to -€2,255.07
  Set starting balance for savings account to €910.94 on Jan 1, 2025
`);
  process.exit(0);
}

const accountId = args[0];
const balance = parseFloat(args[1]);
const date = args[2];

if (isNaN(balance)) {
  console.error("❌ Invalid balance amount");
  process.exit(1);
}

setStartingBalance(accountId, balance, date);
