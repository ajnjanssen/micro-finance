/**
 * Initialize Financial Configuration
 * Set up your actual income and expenses manually
 */

import fs from "node:fs";
import path from "node:path";
import type { FinancialConfiguration } from "../src/types/financial-config";
import { generateId } from "../src/types/financial-config";

const config: FinancialConfiguration = {
  version: "3.0",
  lastUpdated: new Date().toISOString(),

  // Your actual current balances (as of Oct 19, 2025)
  startingBalance: {
    date: "2024-10-01",
    checking: 1686.6, // Calculated to result in current balance
    savings: 0,
  },

  // YOUR INCOME
  incomeSources: [
    {
      id: generateId(),
      name: "Salary - EXACT CLOUD DEVELOPMENT",
      amount: 2800, // Approximate monthly average
      frequency: "monthly",
      dayOfMonth: 23,
      startDate: "2024-10-01",
      isActive: true,
      category: "salary",
      notes: "Main salary, varies between €2,750-2,820",
    },
  ],

  // YOUR RECURRING EXPENSES
  recurringExpenses: [
    {
      id: generateId(),
      name: "Rent - Patrimonium",
      category: "rent",
      amount: 727.33,
      frequency: "monthly",
      dayOfMonth: 1,
      startDate: "2024-10-01",
      isActive: true,
      isEssential: true,
      isVariable: false,
      notes: "Monthly rent",
    },
    {
      id: generateId(),
      name: "Health Insurance - Menzis",
      category: "health-insurance",
      amount: 135, // Estimate
      frequency: "monthly",
      startDate: "2024-10-01",
      isActive: true,
      isEssential: true,
      isVariable: false,
    },
    {
      id: generateId(),
      name: "Transport - OV-chipkaart",
      category: "public-transport",
      amount: 80, // Estimate based on your data
      frequency: "monthly",
      startDate: "2024-10-01",
      isActive: true,
      isEssential: true,
      isVariable: false,
    },
    {
      id: generateId(),
      name: "Utilities - ANWB Energie",
      category: "utilities",
      amount: 150, // Estimate
      frequency: "monthly",
      startDate: "2024-10-01",
      isActive: true,
      isEssential: true,
      isVariable: true,
      estimatedVariance: 20,
    },
    {
      id: generateId(),
      name: "Internet - Ziggo",
      category: "utilities",
      amount: 50, // Estimate
      frequency: "monthly",
      startDate: "2024-10-01",
      isActive: true,
      isEssential: true,
      isVariable: false,
    },
    {
      id: generateId(),
      name: "Bank Fees - OranjePakket",
      category: "bank-fees",
      amount: 3.9,
      frequency: "monthly",
      startDate: "2024-10-01",
      isActive: true,
      isEssential: true,
      isVariable: false,
    },
    {
      id: generateId(),
      name: "Subscription - Netflix",
      category: "subscriptions",
      amount: 12,
      frequency: "monthly",
      startDate: "2024-10-01",
      isActive: true,
      isEssential: false,
      isVariable: false,
    },
    {
      id: generateId(),
      name: "Subscription - Flitsmeister",
      category: "subscriptions",
      amount: 2.99,
      frequency: "monthly",
      startDate: "2024-10-01",
      isActive: true,
      isEssential: false,
      isVariable: false,
    },
  ],

  oneTimeExpenses: [],
  savingsGoals: [],

  settings: {
    defaultCurrency: "EUR",
    projectionMonths: 36,
    conservativeMode: false,
  },
};

// Save to file
const configPath = path.join(process.cwd(), "data", "financial-config.json");
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log("\n✅ Financial configuration initialized!");
console.log(`📁 Saved to: ${configPath}\n`);

// Show summary
const monthlyIncome = config.incomeSources.reduce(
  (sum, s) => sum + s.amount,
  0
);
const monthlyExpenses = config.recurringExpenses.reduce(
  (sum, e) => sum + e.amount,
  0
);

console.log("📊 Configuration Summary:");
console.log(`   Monthly Income: €${monthlyIncome.toFixed(2)}`);
console.log(`   Monthly Expenses: €${monthlyExpenses.toFixed(2)}`);
console.log(
  `   Monthly Net: €${(monthlyIncome - monthlyExpenses).toFixed(2)}\n`
);

console.log("💡 Next steps:");
console.log("   1. Review and adjust amounts in data/financial-config.json");
console.log("   2. Add any missing recurring expenses");
console.log("   3. Update the dashboard to use this configuration");
console.log(
  "   4. Projections will be based on THESE numbers, not CSV detection\n"
);
