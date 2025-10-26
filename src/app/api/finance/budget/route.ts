import { NextRequest, NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";
import { BudgetService } from "@/services/budget-service";
import { CategoryService } from "@/services/category-service";
import { TransactionService } from "@/services/transaction-service";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const savingsGoal = parseInt(searchParams.get("savingsGoal") || "1000");
    const monthParam = searchParams.get("month"); // Format: YYYY-MM

    // Get service instances
    const dataService = FinancialDataService.getInstance();
    const budgetService = BudgetService.getInstance();
    const categoryService = CategoryService.getInstance();
    const transactionService = TransactionService.getInstance();

    const data = await dataService.loadData();

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

    // Get current month expenses using TransactionService
    const monthExpenses = transactionService.getMonthExpenses(
      data.transactions,
      year,
      month
    );

    // Aggregate by category using TransactionService
    const spentByCategory =
      transactionService.aggregateByCategory(monthExpenses);

    // Load budget mappings and user categories to check which are actually mapped
    const budgetMappings = configData.budgetCategoryMappings || {};

    // Flatten the array values to get all mapped category IDs
    const mappedCategoryIds = new Set(
      Object.values(budgetMappings)
        .flat()
        .filter((id): id is string => typeof id === "string")
    );

    // Load user categories
    const userCategories = data.categories || [];
    const userCategoryMap = new Map(
      userCategories.map((cat) => [cat.id, cat.name])
    );

    // Track unmapped categories with examples for smart suggestions
    const unmappedCategories = new Map<
      string,
      { count: number; totalAmount: number; examples: string[] }
    >();

    monthExpenses.forEach((t) => {
      // Find the user category for this transaction
      const userCategory = userCategories.find(
        (cat) => cat.name === t.category || cat.id === t.category
      );
      const categoryId = userCategory?.id;

      // Check if this category is mapped to a budget category
      const isMapped = categoryId && mappedCategoryIds.has(categoryId);

      // Track unmapped categories (those without budget mappings)
      if (!isMapped && t.category) {
        const categoryName = userCategory?.name || t.category;
        const existing = unmappedCategories.get(categoryName) || {
          count: 0,
          totalAmount: 0,
          examples: [],
        };
        existing.count++;
        existing.totalAmount += Math.abs(t.amount);
        if (existing.examples.length < 3) {
          existing.examples.push(t.description);
        }
        unmappedCategories.set(categoryName, existing);
      }
    });

    // Calculate category budgets using BudgetService
    const monthlyIncome = 2787.67;
    const budgets = budgetService.calculateCategoryBudgets(
      monthlyIncome,
      configuredExpenses,
      data.transactions,
      endDate
    );

    // Generate smart suggestions for unmapped categories
    const categorySuggestions = Array.from(unmappedCategories.entries()).map(
      ([cat, info]) => ({
        category: cat,
        count: info.count,
        totalAmount: Math.round(info.totalAmount * 100) / 100,
        examples: info.examples,
        suggestions: categoryService.suggestCategories(info.examples),
      })
    );

    // Calculate summary totals
    const studentDebt = 59.77;
    const availableForSpending = monthlyIncome - savingsGoal - studentDebt;
    const totalSpent = Object.values(spentByCategory).reduce(
      (sum, val) => sum + val,
      0
    );

    return NextResponse.json({
      budgets,
      unmappedCategories: categorySuggestions,
      summary: {
        monthlyIncome,
        savingsGoal,
        studentDebt,
        availableForSpending,
        totalSpent,
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
