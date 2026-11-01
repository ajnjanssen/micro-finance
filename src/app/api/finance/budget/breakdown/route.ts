import { type NextRequest, NextResponse } from "next/server";
import { BudgetService } from "@/services/budget-service";
import { FinancialConfigService } from "@/services/financial-config-service";
import { FinancialDataService } from "@/services/financial-data";
import { getSavingsGoalCurrentAmount } from "@/services/savings-goal-progress";
import { listUserSavingsGoals } from "@/services/supabase-savings-goal-store";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get("month"); // Format: YYYY-MM

    // Get service instances
    const dataService = FinancialDataService.getInstance();
    const budgetService = BudgetService.getInstance();

    const data = await dataService.loadData();

    // Load configured income, expenses, and savings goals
    const configData = await FinancialConfigService.getInstance().loadConfig();
    const allGoals = await listUserSavingsGoals();

    const configuredIncome = configData.incomeSources || [];
    const configuredExpenses = configData.recurringExpenses || [];
    const savingsGoals = allGoals.map((goal) => ({
      ...goal,
      currentAmount: getSavingsGoalCurrentAmount(
        goal,
        data.transactions,
        data.accounts,
        allGoals,
      ),
    }));

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
      .filter((source) => source.isActive)
      .reduce(
        (sum, source) =>
          sum + budgetService.convertToMonthly(source.amount, source.frequency),
        0,
      );

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
    const transactionsWithCategoryNames = data.transactions.map((t) => ({
      ...t,
      category: categoryMap.get(t.category) || t.category,
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
      customPercentages,
      data.accounts,
    );

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error("Error generating budget breakdown:", error);
    return NextResponse.json(
      { error: "Failed to generate budget breakdown" },
      { status: 500 },
    );
  }
}
