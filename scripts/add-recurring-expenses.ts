/**
 * Add recurring expense transactions based on ING bank averages
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

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function addRecurringExpenses() {
  console.log("Loading financial data...");
  const fileContent = await fs.readFile(DATA_FILE_PATH, "utf-8");
  const data: FinancialData = JSON.parse(fileContent);

  // Find the main checking account
  const mainAccount = data.accounts.find((acc) => acc.name === "Main");
  if (!mainAccount) {
    console.error("Main account not found!");
    return;
  }

  // Find or create categories
  const categories = {
    leisure: data.categories.find((c) => c.name.toLowerCase().includes("vrije tijd")) 
      || data.categories.find((c) => c.name.toLowerCase().includes("entertainment")),
    groceries: data.categories.find((c) => c.name.toLowerCase().includes("boodschappen"))
      || data.categories.find((c) => c.name.toLowerCase().includes("eten")),
    restaurants: data.categories.find((c) => c.name.toLowerCase().includes("restaurant"))
      || data.categories.find((c) => c.name.toLowerCase().includes("eten")),
    shopping: data.categories.find((c) => c.name.toLowerCase().includes("winkel"))
      || data.categories.find((c) => c.name.toLowerCase().includes("shopping")),
    transport: data.categories.find((c) => c.name.toLowerCase().includes("vervoer"))
      || data.categories.find((c) => c.name.toLowerCase().includes("transport")),
  };

  // Create missing categories
  if (!categories.leisure) {
    categories.leisure = {
      id: generateId("cat"),
      name: "Vrije tijd",
      type: "expense",
      color: "#a855f7",
    };
    data.categories.push(categories.leisure);
    console.log("+ Created category: Vrije tijd");
  }

  if (!categories.groceries) {
    categories.groceries = {
      id: generateId("cat"),
      name: "Boodschappen",
      type: "expense",
      color: "#10b981",
    };
    data.categories.push(categories.groceries);
    console.log("+ Created category: Boodschappen");
  }

  if (!categories.restaurants) {
    categories.restaurants = {
      id: generateId("cat"),
      name: "Restaurants & Bars",
      type: "expense",
      color: "#f59e0b",
    };
    data.categories.push(categories.restaurants);
    console.log("+ Created category: Restaurants & Bars");
  }

  if (!categories.shopping) {
    categories.shopping = {
      id: generateId("cat"),
      name: "Winkelen",
      type: "expense",
      color: "#ec4899",
    };
    data.categories.push(categories.shopping);
    console.log("+ Created category: Winkelen");
  }

  if (!categories.transport) {
    categories.transport = {
      id: generateId("cat"),
      name: "Vervoer",
      type: "expense",
      color: "#3b82f6",
    };
    data.categories.push(categories.transport);
    console.log("+ Created category: Vervoer");
  }

  // Define recurring expenses based on ING averages
  const newExpenses: Omit<Transaction, "id">[] = [
    // Vrije tijd (Leisure) - €22.98/month average
    {
      description: "Vrije tijd budget",
      amount: -23,
      type: "expense",
      category: categories.leisure!.id,
      accountId: mainAccount.id,
      date: "2025-10-01",
      isRecurring: true,
      recurringType: "monthly",
      tags: ["entertainment", "hobby"],
      categoryReason: "Monthly leisure budget based on ING average",
      completed: false,
    },
    // Boodschappen (Groceries) - €422.15/month average
    {
      description: "Boodschappen budget",
      amount: -422,
      type: "expense",
      category: categories.groceries!.id,
      accountId: mainAccount.id,
      date: "2025-10-01",
      isRecurring: true,
      recurringType: "monthly",
      tags: ["groceries", "food"],
      categoryReason: "Monthly groceries budget based on ING average",
      completed: false,
    },
    // Restaurants & Bars - €78.84/month average
    {
      description: "Restaurants & Bars budget",
      amount: -79,
      type: "expense",
      category: categories.restaurants!.id,
      accountId: mainAccount.id,
      date: "2025-10-01",
      isRecurring: true,
      recurringType: "monthly",
      tags: ["dining", "restaurants"],
      categoryReason: "Monthly dining budget based on ING average",
      completed: false,
    },
    // Winkelen (Shopping) - rounded to €250/month
    {
      description: "Shopping budget",
      amount: -250,
      type: "expense",
      category: categories.shopping!.id,
      accountId: mainAccount.id,
      date: "2025-10-01",
      isRecurring: true,
      recurringType: "monthly",
      tags: ["shopping", "clothing"],
      categoryReason: "Monthly shopping budget (rounded from €728 average)",
      completed: false,
    },
    // Vervoer (Transport) - €50/month base
    {
      description: "Vervoer - vast bedrag",
      amount: -50,
      type: "expense",
      category: categories.transport!.id,
      accountId: mainAccount.id,
      date: "2025-10-01",
      isRecurring: true,
      recurringType: "monthly",
      tags: ["transport", "fixed"],
      categoryReason: "Monthly transport fixed cost",
      completed: false,
    },
    // Vervoer - €25 every 4 days (approximately 7.5 times per month = €187.50)
    {
      description: "Vervoer - variabel",
      amount: -6.25,
      type: "expense",
      category: categories.transport!.id,
      accountId: mainAccount.id,
      date: "2025-10-01",
      isRecurring: true,
      recurringType: "daily",
      tags: ["transport", "daily"],
      categoryReason: "Daily transport cost (€25 every 4 days = €6.25/day average)",
      completed: false,
    },
  ];

  // Add transactions
  let addedCount = 0;
  for (const expense of newExpenses) {
    const transaction: Transaction = {
      ...expense,
      id: generateId("tx"),
    };

    data.transactions.push(transaction);
    console.log(`+ Added: ${transaction.description} - €${Math.abs(transaction.amount)}`);
    addedCount++;
  }

  // Sort transactions by date (newest first)
  data.transactions.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Save updated data
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2));

  console.log(`\n✅ Added ${addedCount} recurring expenses`);
  console.log(`✓ Total transactions: ${data.transactions.length}`);
  console.log(`✓ Total categories: ${data.categories.length}`);
  console.log("\nMonthly recurring expenses summary:");
  console.log("  • Vrije tijd: €23");
  console.log("  • Boodschappen: €422");
  console.log("  • Restaurants & Bars: €79");
  console.log("  • Shopping: €250");
  console.log("  • Vervoer (fixed): €50");
  console.log("  • Vervoer (daily): €6.25/day (≈€187.50/month)");
  console.log("  ─────────────────────────");
  console.log("  Total: ≈€1,011.50/month");
}

// Run the script
addRecurringExpenses().catch((error) => {
  console.error("❌ Error adding recurring expenses:", error);
  process.exit(1);
});
