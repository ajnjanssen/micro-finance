import { NextRequest, NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";
import { BudgetService } from "@/services/budget-service";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get("month"); // Format: YYYY-MM

    // Get service instances
    const dataService = FinancialDataService.getInstance();
    const budgetService = BudgetService.getInstance();

    const data = await dataService.loadData();

    // Load configured income, expenses, and savings goals
    const configPath = path.join(
      process.cwd(),
      "data",
      "financial-config.json"
    );
    const configData = JSON.parse(await fs.readFile(configPath, "utf-8"));

    const goalsPath = path.join(process.cwd(), "data", "savings-goals.json");
    const goalsData = JSON.parse(await fs.readFile(goalsPath, "utf-8"));

    const configuredIncome = configData.incomeSources || configData.income || [];
    const configuredExpenses = configData.recurringExpenses || [];
    const savingsGoals = goalsData.goals || [];

    // Parse month or use current
    let year: number, month: number;
    if (monthParam) {
      [year, month] = monthParam.split("-").map(Number);
    } else {
      const today = new Date();
      year = today.getFullYear();
      month = today.getMonth() + 1;
    }

    const monthEndDate = new Date(year, month, 0);

    // Calculate total monthly income (configured + recurring)
    const configuredIncomeTotal = configuredIncome
      .filter((s: any) => s.isActive)
      .reduce((sum: number, s: any) => sum + s.amount, 0);

    // Only include recurring income that occurs THIS month
    const currentMonth = monthEndDate.getMonth();
    const recurringIncome = data.transactions
      .filter((t) => {
        if (!t.isRecurring || t.type !== "income") return false;

        // For yearly transactions, only include if it's the correct month
        if (t.recurringType === "yearly") {
          const txDate = new Date(t.date);
          const txMonth = txDate.getMonth();
          return txMonth === currentMonth;
        }

        // For monthly/quarterly/etc, include them
        return true;
      })
      .reduce((sum: number, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = configuredIncomeTotal + recurringIncome;

    // Create a category ID to name map
    const categoryMap = new Map<string, string>();
    for (const cat of data.categories) {
      categoryMap.set(cat.id, cat.name.toLowerCase());
    }

    // Resolve category IDs in transactions to category names for budget service
    const transactionsWithCategoryNames = data.transactions.map(t => ({
      ...t,
      category: categoryMap.get(t.category) || t.category
    }));

    // Get custom budget percentages from config if set
    const customPercentages = configData.settings?.budgetPercentages;

    // Calculate budget breakdown using BudgetService
    const breakdown = budgetService.calculateBudgetBreakdown(
      totalIncome,
      configuredExpenses,
      transactionsWithCategoryNames,
      savingsGoals,
      monthEndDate,
      customPercentages
    );

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error("Error generating budget breakdown:", error);
    return NextResponse.json(
      { error: "Failed to generate budget breakdown" },
      { status: 500 }
    );
  }
}
