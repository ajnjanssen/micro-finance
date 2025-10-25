/**
 * Script to add recurring €500 savings transaction
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

const DATA_FILE = path.join(process.cwd(), "data", "financial-data.json");
const GOALS_FILE = path.join(process.cwd(), "data", "savings-goals.json");

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  categoryId?: string;
  category?: string;
  accountId: string;
  date: string;
  isRecurring: boolean;
  recurringType?: string;
  tags: string[];
  categoryReason: string;
  completed?: boolean;
  recurringEndDate?: string;
  savingsGoalId?: string;
  [key: string]: unknown;
}

interface Category {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface Account {
  id: string;
  name: string;
  type: string;
  [key: string]: unknown;
}

interface SavingsGoal {
  id: string;
  name: string;
  [key: string]: unknown;
}

async function addSavingsTransaction() {
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

    // Find the savings account
    const savingsAccount = data.accounts.find(
      (acc: Account) => acc.type === "savings"
    );

    if (!savingsAccount) {
      console.error("❌ Could not find savings account");
      return;
    }

    console.log(`✓ Found savings account: ${savingsAccount.name} (${savingsAccount.id})`);

    // Find the checking account (where money comes from)
    const checkingAccount = data.accounts.find(
      (acc: Account) => acc.type === "checking"
    );

    if (!checkingAccount) {
      console.error("❌ Could not find checking account");
      return;
    }

    console.log(`✓ Found checking account: ${checkingAccount.name} (${checkingAccount.id})`);

    // Find the first savings goal
    const goal: SavingsGoal | undefined = goalsData.goals[0];

    if (!goal) {
      console.error("❌ No savings goals found");
      return;
    }

    console.log(`✓ Found savings goal: ${goal.name}`);

    // Check if savings transaction already exists
    const existingSavings = data.transactions.find(
      (t: Transaction) => 
        t.description === "Maandelijks Sparen" &&
        t.isRecurring &&
        t.categoryId === savingsCategory.id
    );

    if (existingSavings) {
      console.log("\n✓ Monthly savings transaction already exists");
      
      // Make sure it's linked to the goal
      if (!existingSavings.savingsGoalId) {
        existingSavings.savingsGoalId = goal.id;
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        console.log("✓ Linked existing transaction to goal");
      }
      
      return;
    }

    // Create new savings transaction
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}-savings`,
      description: "Maandelijks Sparen",
      amount: 500, // Positive because it's income to savings account
      type: "income",
      categoryId: savingsCategory.id,
      category: savingsCategory.id,
      accountId: savingsAccount.id, // Goes to savings account
      date: "2025-10-25",
      isRecurring: true,
      recurringType: "monthly",
      tags: ["sparen", "doelen"],
      categoryReason: "Recurring savings transfer",
      completed: false,
      recurringEndDate: "",
      savingsGoalId: goal.id, // Link to the motorcycle goal
    };

    // Add the transaction
    data.transactions.push(newTransaction);

    // Save the updated data
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));

    console.log("\n✅ Successfully added monthly savings transaction");
    console.log(`   Amount: €${newTransaction.amount}`);
    console.log(`   Account: ${savingsAccount.name}`);
    console.log(`   Linked to: ${goal.name}`);
    console.log(`   Category: ${savingsCategory.name}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addSavingsTransaction();
