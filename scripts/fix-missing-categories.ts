/**
 * Fix transactions with missing category IDs
 * Creates missing categories and updates transactions to use proper category IDs
 */

import fs from "fs/promises";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "financial-data.json");

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
}

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
}

interface FinancialData {
  accounts: any[];
  transactions: Transaction[];
  categories: Category[];
  lastUpdated: string;
}

// Define category mappings for common strings to proper categories
const CATEGORY_MAPPINGS: Record<string, { name: string; color: string }> = {
  insurance: { name: "Verzekeringen", color: "#f97316" }, // orange
  telecom: { name: "Telefoon & Internet", color: "#8b5cf6" }, // purple
  utilities: { name: "Nutsvoorzieningen", color: "#eab308" }, // yellow
  banking: { name: "Bankkosten", color: "#6b7280" }, // gray
  groceries: { name: "Boodschappen", color: "#10b981" }, // green
  salary: { name: "Salaris", color: "#22c55e" }, // green
  bonus: { name: "Bonus", color: "#84cc16" }, // lime
};

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function fixMissingCategories() {
  console.log("Loading financial data...");
  const fileContent = await fs.readFile(DATA_FILE_PATH, "utf-8");
  const data: FinancialData = JSON.parse(fileContent);

  console.log(`Found ${data.transactions.length} transactions`);
  console.log(`Found ${data.categories.length} existing categories`);

  // Find all unique category strings that don't have matching IDs
  const categoryStrings = new Set<string>();
  const existingCategoryIds = new Set(data.categories.map((c) => c.id));
  const existingCategoryNames = new Set(
    data.categories.map((c) => c.name.toLowerCase())
  );

  for (const transaction of data.transactions) {
    // If category doesn't start with 'cat-', it's a string name not an ID
    if (transaction.category && !transaction.category.startsWith("cat-")) {
      categoryStrings.add(transaction.category);
    }
  }

  console.log(
    `\nFound ${categoryStrings.size} transactions with string categories instead of IDs:`
  );
  categoryStrings.forEach((cat) => console.log(`  - ${cat}`));

  // Create missing categories
  const categoryMap: Record<string, string> = {}; // string -> category ID

  for (const categoryString of categoryStrings) {
    const mapping = CATEGORY_MAPPINGS[categoryString.toLowerCase()];

    if (!mapping) {
      console.warn(
        `⚠️  No mapping found for category: "${categoryString}" - skipping`
      );
      continue;
    }

    // Check if category with this name already exists
    const existingCategory = data.categories.find(
      (c) => c.name.toLowerCase() === mapping.name.toLowerCase()
    );

    if (existingCategory) {
      console.log(
        `✓ Category "${mapping.name}" already exists, using ID: ${existingCategory.id}`
      );
      categoryMap[categoryString] = existingCategory.id;
    } else {
      // Create new category
      const newCategory: Category = {
        id: generateId("cat"),
        name: mapping.name,
        type: "expense", // Most unmapped categories are expenses
        color: mapping.color,
      };

      data.categories.push(newCategory);
      categoryMap[categoryString] = newCategory.id;
      console.log(`+ Created new category: ${mapping.name} (${newCategory.id})`);
    }
  }

  // Update all transactions with proper category IDs
  let updatedCount = 0;
  for (const transaction of data.transactions) {
    if (
      transaction.category &&
      !transaction.category.startsWith("cat-") &&
      categoryMap[transaction.category]
    ) {
      const oldCategory = transaction.category;
      transaction.category = categoryMap[oldCategory];
      console.log(
        `  Updated transaction "${transaction.description}": ${oldCategory} -> ${transaction.category}`
      );
      updatedCount++;
    }
  }

  console.log(`\n✓ Updated ${updatedCount} transactions with proper category IDs`);
  console.log(`✓ Total categories: ${data.categories.length}`);

  // Save updated data
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2));
  console.log("\n✅ Financial data updated successfully!");
}

// Run the script
fixMissingCategories().catch((error) => {
  console.error("❌ Error fixing categories:", error);
  process.exit(1);
});
