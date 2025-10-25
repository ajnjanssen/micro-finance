/**
 * Script to link savings transactions to a specific savings goal
 * This allows tracking actual progress towards the goal
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

const DATA_FILE = path.join(process.cwd(), "data", "financial-data.json");
const GOALS_FILE = path.join(process.cwd(), "data", "savings-goals.json");

interface Transaction {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  savingsGoalId?: string;
  [key: string]: unknown;
}

interface Category {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface SavingsGoal {
  id: string;
  name: string;
  [key: string]: unknown;
}

async function linkSavingsToGoal() {
  try {
    console.log("Loading financial data...");
    const dataContent = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(dataContent);

    console.log("Loading savings goals...");
    const goalsContent = await fs.readFile(GOALS_FILE, "utf-8");
    const goalsData = JSON.parse(goalsContent);

    // Find the savings category
    const savingsCategory = data.categories.find(
      (cat: Category) => cat.name === "Sparen"
    );

    if (!savingsCategory) {
      console.error("❌ Could not find 'Sparen' category");
      return;
    }

    console.log(`✓ Found savings category: ${savingsCategory.name} (${savingsCategory.id})`);

    // Find the first savings goal (the motorcycle)
    const goal: SavingsGoal | undefined = goalsData.goals[0];

    if (!goal) {
      console.error("❌ No savings goals found");
      return;
    }

    console.log(`✓ Found savings goal: ${goal.name}`);

    // Find all savings transactions (recurring ones with the savings category)
    const savingsTransactions = data.transactions.filter(
      (t: Transaction) => 
        t.categoryId === savingsCategory.id &&
        t.description.toLowerCase().includes("sparen")
    );

    console.log(`\n✓ Found ${savingsTransactions.length} savings transactions`);

    // Link them to the goal
    let linkedCount = 0;
    for (const transaction of savingsTransactions) {
      if (!transaction.savingsGoalId) {
        transaction.savingsGoalId = goal.id;
        linkedCount++;
        console.log(`  - Linked: ${transaction.description} (€${transaction.amount})`);
      }
    }

    if (linkedCount === 0) {
      console.log("\n✓ All savings transactions already linked to goal");
      return;
    }

    // Save the updated data
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));

    console.log(`\n✅ Successfully linked ${linkedCount} transactions to "${goal.name}"`);
    
    // Calculate total saved
    const totalSaved = savingsTransactions.reduce(
      (sum: number, t: Transaction) => sum + Math.abs(t.amount),
      0
    );
    console.log(`\n📊 Total saved towards goal: €${totalSaved.toFixed(2)}`);
    console.log(`📊 Target amount: €${goal.targetAmount || 0}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

linkSavingsToGoal();
