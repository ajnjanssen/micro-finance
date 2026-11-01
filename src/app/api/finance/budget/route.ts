import { type NextRequest, NextResponse } from "next/server";
import { AssetsLiabilitiesService } from "@/services/assets-liabilities-service";
import { BudgetService } from "@/services/budget-service";
import { CategoryService } from "@/services/category-service";
import { FinancialConfigService } from "@/services/financial-config-service";
import { FinancialDataService } from "@/services/financial-data";
import { TransactionService } from "@/services/transaction-service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const savingsGoal = Number.parseInt(
      searchParams.get("savingsGoal") || "1000",
      10,
    );
    const monthParam = searchParams.get("month"); // Format: YYYY-MM

    // Get service instances
    const dataService = FinancialDataService.getInstance();
    const budgetService = BudgetService.getInstance();
    const categoryService = CategoryService.getInstance();
    const transactionService = TransactionService.getInstance();

    const data = await dataService.loadData();

    // Load configured recurring expenses
    const configData = await FinancialConfigService.getInstance().loadConfig();
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

    const endDate = new Date(year, month, 0);

    // Get current month expenses using TransactionService
    const monthExpenses = transactionService.getMonthExpenses(
      data.transactions,
      year,
      month,
    );

    // Load budget mappings to convert transaction categories to budget categories
    const budgetMappings = configData.budgetCategoryMappings || {};

    // Create reverse mapping: categoryId -> budgetCategory
    const categoryToBudget = new Map<string, string>();
    for (const [budgetCat, categoryIds] of Object.entries(budgetMappings)) {
      const ids = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
      for (const catId of ids) {
        if (typeof catId === "string") {
          categoryToBudget.set(catId, budgetCat);
        }
      }
    }

    // Aggregate spending by budget category (not transaction category)
    const spentByCategory = new Map<string, number>();
    for (const transaction of monthExpenses) {
      const budgetCategory = categoryToBudget.get(transaction.category);
      if (budgetCategory) {
        const current = spentByCategory.get(budgetCategory) || 0;
        spentByCategory.set(
          budgetCategory,
          current + Math.abs(transaction.amount),
        );
      }
    }

    // Flatten the array values to get all mapped category IDs
    const mappedCategoryIds = new Set(
      Object.values(budgetMappings)
        .flat()
        .filter((id): id is string => typeof id === "string"),
    );

    // Load user categories
    const userCategories = data.categories || [];
    // Track unmapped categories with examples for smart suggestions
    const unmappedCategories = new Map<
      string,
      { count: number; totalAmount: number; examples: string[] }
    >();

    monthExpenses.forEach((t) => {
      // Find the user category for this transaction
      const userCategory = userCategories.find(
        (cat) => cat.name === t.category || cat.id === t.category,
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
    const monthlyIncome = configData.incomeSources
      .filter((source) => source.isActive)
      .reduce(
        (total, source) =>
          total +
          budgetService.convertToMonthly(source.amount, source.frequency),
        0,
      );
    const budgets = budgetService.calculateCategoryBudgets(
      monthlyIncome,
      configuredExpenses,
      data.transactions,
      endDate,
      spentByCategory,
    );

    // Generate smart suggestions for unmapped categories
    const categorySuggestions = Array.from(unmappedCategories.entries()).map(
      ([cat, info]) => ({
        category: cat,
        count: info.count,
        totalAmount: Math.round(info.totalAmount * 100) / 100,
        examples: info.examples,
        suggestions: categoryService.suggestCategories(info.examples),
      }),
    );

    // Calculate summary totals
    const assetsService = AssetsLiabilitiesService.getInstance();
    const totalDebtPayments = await assetsService.getTotalMonthlyDebtPayments();

    const availableForSpending =
      monthlyIncome - savingsGoal - totalDebtPayments;
    const totalSpent = Array.from(spentByCategory.values()).reduce(
      (sum, val) => sum + val,
      0,
    );

    return NextResponse.json({
      budgets,
      unmappedCategories: categorySuggestions,
      summary: {
        monthlyIncome,
        savingsGoal,
        debtPayments: totalDebtPayments,
        availableForSpending,
        totalSpent,
      },
    });
  } catch (error) {
    console.error("Error generating budget:", error);
    return NextResponse.json(
      { error: "Failed to generate budget" },
      { status: 500 },
    );
  }
}
