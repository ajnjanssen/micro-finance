import { NextRequest, NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const savingsGoal = parseInt(searchParams.get("savingsGoal") || "1000");
    const monthParam = searchParams.get("month"); // Format: YYYY-MM

    const service = FinancialDataService.getInstance();
    const data = await service.loadData();

    // Load configured recurring expenses
    const configPath = path.join(
      process.cwd(),
      "data",
      "financial-config.json"
    );
    const configData = JSON.parse(await fs.readFile(configPath, "utf-8"));
    const configuredExpenses = configData.recurringExpenses || [];

    // Parse month or use current
    let year: number, month: number;
    if (monthParam) {
      [year, month] = monthParam.split("-").map(Number);
    } else {
      const today = new Date();
      year = today.getFullYear();
      month = today.getMonth() + 1;
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get current month expenses by category
    const monthExpenses = data.transactions.filter((t) => {
      const tDate = new Date(t.date);
      // If type is not set, infer from amount (negative = expense)
      const isExpense = t.type === "expense" || (!t.type && t.amount < 0);
      return tDate >= startDate && tDate <= endDate && isExpense;
    });

    // Smart category suggestion based on transaction description
    const suggestCategory = (
      category: string,
      examples: string[]
    ): string[] => {
      const suggestions: string[] = [];
      const exampleText = examples.join(" ").toLowerCase();

      if (category === "uncategorized") {
        // Check examples for patterns
        if (
          exampleText.includes("plus") ||
          exampleText.includes("jumbo") ||
          exampleText.includes("albert")
        ) {
          suggestions.push("groceries");
        }
        if (
          exampleText.includes("shell") ||
          exampleText.includes("esso") ||
          exampleText.includes("bp")
        ) {
          suggestions.push("transport");
        }
        if (
          exampleText.includes("netflix") ||
          exampleText.includes("spotify") ||
          exampleText.includes("disney")
        ) {
          suggestions.push("entertainment");
        }
        return suggestions.length > 0
          ? suggestions
          : ["shopping", "food", "transport"];
      }

      if (category === "utilities") {
        return ["housing"];
      }

      return ["housing", "transport", "shopping"];
    };

    // Normalize category name and map to standard budget category
    const normalizeCategoryName = (category: string): string => {
      // First check exact match in categoryMap
      if (categoryMap[category]) {
        return categoryMap[category];
      }

      // Normalize: lowercase, remove special chars, trim spaces
      const normalized = category
        .toLowerCase()
        .replace(/[&\-_]/g, " ")
        .trim()
        .replace(/\s+/g, " ");

      // Dutch to English translations for common words
      const dutchToEnglish: { [key: string]: string } = {
        boodschappen: "groceries",
        "eten drinken": "food",
        "eten en drinken": "food",
        entertainment: "entertainment",
        verzekeringen: "insurance",
        verzekering: "insurance",
        belastingdienst: "housing",
        onbekend: "shopping",
        klarna: "shopping",
        sparen: "vacation",
        saving: "vacation",
        savings: "vacation",
        "health insurance": "insurance",
        healthinsurance: "insurance",
        gezondheid: "insurance",
        voorschieten: "shopping",
        winkelen: "shopping",
        shopping: "shopping",
        motor: "transport",
        auto: "transport",
        car: "transport",
        wonen: "housing",
        living: "housing",
        transport: "transport",
        vervoer: "transport",
        dining: "food",
        fuel: "transport",
        brandstof: "transport",
        "public transport": "transport",
        ov: "transport",
        subscriptions: "entertainment",
        abonnementen: "entertainment",
        "bank fees": "shopping",
        rent: "housing",
        huur: "housing",
        utilities: "housing",
        energie: "housing",
      };

      // Check if normalized string matches any translation
      if (dutchToEnglish[normalized]) {
        return dutchToEnglish[normalized];
      }

      // Check if it contains key words
      for (const [dutch, english] of Object.entries(dutchToEnglish)) {
        if (normalized.includes(dutch) || dutch.includes(normalized)) {
          return english;
        }
      }

      // If the category is already a known budget category, return it
      if (knownBudgetCategories.has(normalized)) {
        return normalized;
      }

      // Default: return original category for unmapped items
      return category;
    };

    // Simple static mapping for exact matches (for performance)
    const categoryMap: { [key: string]: string } = {
      dining: "food",
      fuel: "transport",
      "public-transport": "transport",
      subscriptions: "entertainment",
      "bank-fees": "shopping",
      rent: "housing",
      utilities: "housing",
    };

    // Known budget categories
    const knownBudgetCategories = new Set([
      "housing",
      "insurance",
      "transport",
      "groceries",
      "food",
      "entertainment",
      "shopping",
      "vacation",
    ]);

    const spentByCategory: { [key: string]: number } = {};
    const unmappedCategories = new Map<
      string,
      { count: number; totalAmount: number; examples: string[] }
    >();

    monthExpenses.forEach((t) => {
      // Map the category using smart normalization
      const budgetCategory = normalizeCategoryName(t.category);

      // Track unmapped categories with examples for smart suggestions
      // Only track if normalization returned the original (unmapped) category
      if (
        budgetCategory === t.category &&
        !knownBudgetCategories.has(budgetCategory.toLowerCase())
      ) {
        const existing = unmappedCategories.get(t.category) || {
          count: 0,
          totalAmount: 0,
          examples: [],
        };
        existing.count++;
        existing.totalAmount += Math.abs(t.amount);
        if (existing.examples.length < 3) {
          existing.examples.push(t.description);
        }
        unmappedCategories.set(t.category, existing);
      }

      spentByCategory[budgetCategory] =
        (spentByCategory[budgetCategory] || 0) + Math.abs(t.amount);
    });

    // Track configured expenses separately
    const configuredByCategory: { [key: string]: number } = {};
    configuredExpenses.forEach((expense: any) => {
      if (expense.isActive) {
        const budgetCategory = normalizeCategoryName(expense.category);
        // Track configured amount for this category
        configuredByCategory[budgetCategory] =
          (configuredByCategory[budgetCategory] || 0) + expense.amount;
        // Ensure category appears in spentByCategory (with 0 if no transactions)
        if (!spentByCategory[budgetCategory]) {
          spentByCategory[budgetCategory] = 0;
        }
      }
    });

    // Calculate average spending from last 3 months for recommendations
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentExpenses = data.transactions.filter((t) => {
      // If type is not set, infer from amount (negative = expense)
      const isExpense = t.type === "expense" || (!t.type && t.amount < 0);
      return (
        new Date(t.date) >= threeMonthsAgo &&
        isExpense &&
        Math.abs(t.amount) <= 200 // Exclude big one-time purchases
      );
    });

    const avgByCategory: { [key: string]: number } = {};
    recentExpenses.forEach((t) => {
      // Use the same category mapping for average calculations
      const budgetCategory = normalizeCategoryName(t.category);
      avgByCategory[budgetCategory] =
        (avgByCategory[budgetCategory] || 0) + Math.abs(t.amount);
    });

    // Convert to monthly average (count actual months with data)
    const monthsWithData = new Set<string>();
    recentExpenses.forEach((t) => {
      monthsWithData.add(t.date.substring(0, 7));
    });
    const monthCount = Math.max(monthsWithData.size, 1);

    Object.keys(avgByCategory).forEach((cat) => {
      avgByCategory[cat] = avgByCategory[cat] / monthCount;
    });

    // Income and constraints
    const monthlyIncome = 2787.67;
    const studentDebt = 59.77; // Starts April 2026
    const availableForSpending = monthlyIncome - savingsGoal - studentDebt;

    // Budget recommendations based on 50/30/20 rule adapted for your situation
    // Essential (housing, groceries, insurance, transport): 60%
    // Discretionary (entertainment, shopping, food out): 25%
    // Buffer: 15%

    const essentialBudget = availableForSpending * 0.6;
    const discretionaryBudget = availableForSpending * 0.25;
    const bufferBudget = availableForSpending * 0.15;

    // Get actual recurring expenses from transactions
    const recurringTransactions = data.transactions.filter(
      (t) => t.isRecurring && t.amount < 0
    );

    // Calculate actual recurring costs from transactions
    const actualHousingFromTransactions = Math.abs(
      recurringTransactions
        .filter(
          (t) =>
            categoryMap[t.category] === "housing" || t.category === "housing"
        )
        .reduce((sum, t) => sum + t.amount, 0)
    );
    const actualInsuranceFromTransactions = Math.abs(
      recurringTransactions
        .filter((t) => t.category === "insurance")
        .reduce((sum, t) => sum + t.amount, 0)
    );
    const actualTransportFromTransactions = Math.abs(
      recurringTransactions
        .filter((t) => t.category === "transport")
        .reduce((sum, t) => sum + t.amount, 0)
    );

    // Add configured recurring expenses (these are always active, don't wait for transactions)
    const configuredHousing = configuredExpenses
      .filter(
        (e: any) =>
          e.isActive &&
          (categoryMap[e.category] === "housing" || e.category === "housing")
      )
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    const configuredInsurance = configuredExpenses
      .filter((e: any) => e.isActive && e.category === "insurance")
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    // Use the maximum of transaction-based or configured (configured expenses should always count)
    const actualHousing = Math.max(
      actualHousingFromTransactions,
      configuredHousing
    );
    const actualInsurance = Math.max(
      actualInsuranceFromTransactions,
      configuredInsurance
    );
    const actualTransport = actualTransportFromTransactions;

    // Category definitions and recommended allocations
    const categoryBudgets = {
      housing: {
        recommended: actualHousing > 0 ? actualHousing : essentialBudget * 0.55,
        description: "Huur, energie, internet, telefoon",
        type: "fixed",
        isRecurring: true,
      },
      insurance: {
        recommended:
          actualInsurance > 0 ? actualInsurance : essentialBudget * 0.25,
        description: "Zorg, auto, aansprakelijkheid",
        type: "fixed",
        isRecurring: true,
      },
      transport: {
        recommended: actualTransport > 0 ? actualTransport : 120,
        description: "Benzine, OV, parkeren (alleen regelmatige kosten)",
        type: "variable",
        isRecurring: false,
      },
      groceries: {
        recommended: essentialBudget * 0.15, // €155
        description: "Boodschappen en huishoudelijke artikelen",
        type: "variable",
        isRecurring: false,
      },
      food: {
        recommended: discretionaryBudget * 0.35, // €121
        description: "Restaurants en takeaway",
        type: "variable",
        isRecurring: false,
      },
      entertainment: {
        recommended: discretionaryBudget * 0.35, // €121
        description: "Streaming, uitgaan, hobby's",
        type: "variable",
        isRecurring: false,
      },
      shopping: {
        recommended: discretionaryBudget * 0.25, // €86
        description: "Kleding, elektronica, persoonlijke verzorging",
        type: "variable",
        isRecurring: false,
      },
      vacation: {
        recommended: bufferBudget * 0.5, // €130
        description: "Vakanties en reizen (sparen per maand)",
        type: "variable",
        isRecurring: false,
      },
      savings: {
        recommended: 0,
        description: "Overige besparingen",
        type: "savings",
        isRecurring: false,
      },
    };

    // Build budget items
    const budgets = Object.entries(categoryBudgets).map(
      ([category, config]) => {
        const spent = spentByCategory[category] || 0;
        const avgSpent = avgByCategory[category] || 0;
        const configured = configuredByCategory[category] || 0;

        // Priority: 1) Configured amount, 2) Average spending, 3) Recommended amount
        // This ensures configured expenses show up even with no transactions
        let budgeted =
          configured > 0 ? configured : Math.max(avgSpent, config.recommended);

        return {
          category,
          budgeted: Math.round(budgeted * 100) / 100,
          spent: Math.round(spent * 100) / 100,
          recommended: Math.round(config.recommended * 100) / 100,
          description: config.description,
          type: config.type,
          isRecurring: config.isRecurring,
        };
      }
    );

    // Add any categories that appear in spending but not in our predefined list
    Object.keys(spentByCategory).forEach((category) => {
      if (!(category in categoryBudgets)) {
        budgets.push({
          category,
          budgeted: spentByCategory[category],
          spent: spentByCategory[category],
          recommended: 0,
          description: "Overige uitgaven",
          type: "variable",
          isRecurring: false,
        });
      }
    });

    // Generate smart suggestions for unmapped categories
    const categorySuggestions = Array.from(unmappedCategories.entries()).map(
      ([cat, info]) => ({
        category: cat,
        count: info.count,
        totalAmount: Math.round(info.totalAmount * 100) / 100,
        examples: info.examples,
        suggestions: suggestCategory(cat, info.examples),
      })
    );

    return NextResponse.json({
      budgets,
      unmappedCategories: categorySuggestions,
      categoryMap, // Return current mapping so UI can show it
      summary: {
        monthlyIncome,
        savingsGoal,
        studentDebt,
        availableForSpending,
        totalSpent: Object.values(spentByCategory).reduce(
          (sum, val) => sum + val,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error generating budget:", error);
    return NextResponse.json(
      { error: "Failed to generate budget" },
      { status: 500 }
    );
  }
}
