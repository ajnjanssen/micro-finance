/**
 * Fix duplicate transactions and recategorize utilities/insurance
 */

import fs from "fs/promises";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "financial-data.json");

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  accountId: string;
  date: string;
  isRecurring: boolean;
  recurringType?: "monthly" | "yearly" | "weekly" | "daily";
  tags?: string[];
  categoryReason?: string;
  completed?: boolean;
}

interface FinancialData {
  accounts: any[];
  transactions: Transaction[];
  categories: any[];
  lastUpdated: string;
}

async function fixTransactions() {
  console.log("Loading financial data...");
  const fileContent = await fs.readFile(DATA_FILE_PATH, "utf-8");
  const data: FinancialData = JSON.parse(fileContent);

  const initialCount = data.transactions.length;
  console.log(`Initial transaction count: ${initialCount}`);

  // Find categories
  const nutsvoorzieningenCategory = data.categories.find(
    (c) => c.name === "Nutsvoorzieningen"
  );
  const insuranceCategory = data.categories.find(
    (c) => c.name === "Verzekeringen"
  );

  if (!nutsvoorzieningenCategory) {
    console.error("Nutsvoorzieningen category not found!");
    return;
  }

  if (!insuranceCategory) {
    console.error("Verzekeringen category not found!");
    return;
  }

  console.log("\nStep 1: Removing duplicates...");
  
  // Track seen transactions by description + amount + date
  const seen = new Set<string>();
  const uniqueTransactions: Transaction[] = [];
  let duplicatesRemoved = 0;

  for (const transaction of data.transactions) {
    const key = `${transaction.description}|${transaction.amount}|${transaction.date}`;
    
    if (seen.has(key)) {
      console.log(`  - Removing duplicate: ${transaction.description} (${transaction.amount})`);
      duplicatesRemoved++;
    } else {
      seen.add(key);
      uniqueTransactions.push(transaction);
    }
  }

  data.transactions = uniqueTransactions;
  console.log(`✓ Removed ${duplicatesRemoved} duplicates`);

  console.log("\nStep 2: Recategorizing transactions...");
  
  // Recategorize ODIDO and ZIGGO to Nutsvoorzieningen (utilities/needs)
  let recategorized = 0;
  
  for (const transaction of data.transactions) {
    // ODIDO and ZIGGO should be utilities (needs)
    if (
      transaction.description.includes("ODIDO") ||
      transaction.description.includes("ZIGGO")
    ) {
      const oldCategory = transaction.category;
      transaction.category = nutsvoorzieningenCategory.id;
      transaction.categoryReason = "Internet/phone service - essential utility";
      console.log(`  ✓ ${transaction.description}: utilities (needs)`);
      recategorized++;
    }
    
    // OranjePakket should be insurance (needs)
    if (transaction.description.includes("OranjePakket")) {
      const oldCategory = transaction.category;
      transaction.category = insuranceCategory.id;
      transaction.categoryReason = "Banking insurance package";
      console.log(`  ✓ ${transaction.description}: insurance (needs)`);
      recategorized++;
    }
  }

  console.log(`✓ Recategorized ${recategorized} transactions`);

  // Save updated data
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2));

  console.log(`\n✅ Fixed transactions successfully!`);
  console.log(`   Initial: ${initialCount} transactions`);
  console.log(`   Final: ${data.transactions.length} transactions`);
  console.log(`   Removed: ${duplicatesRemoved} duplicates`);
  console.log(`   Recategorized: ${recategorized} transactions`);
}

// Run the script
fixTransactions().catch((error) => {
  console.error("❌ Error fixing transactions:", error);
  process.exit(1);
});
