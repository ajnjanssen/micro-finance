import { NextResponse } from "next/server";
import { AssetsLiabilitiesService } from "@/services/assets-liabilities-service";
import { FinancialDataService } from "@/services/financial-data";
import { insertUserCategory } from "@/services/supabase-financial-store";

/**
 * Sync debts to recurring expenses and ensure category exists
 */
export async function POST() {
  try {
    const assetsService = AssetsLiabilitiesService.getInstance();

    // Ensure "Schulden" category exists
    const financialData = await FinancialDataService.getInstance().loadData();
    const debtCategory = financialData.categories.find(
      (category) => category.id === "cat-debt-payments",
    );

    if (!debtCategory) {
      await insertUserCategory({
        id: "cat-debt-payments",
        name: "Schulden",
        type: "expense",
        color: "error",
      });
    }

    // Sync debts to recurring expenses
    await assetsService.syncDebtsToRecurringExpenses();

    return NextResponse.json({
      success: true,
      message: "Debts synced to recurring expenses",
    });
  } catch (error) {
    console.error("Error syncing debts:", error);
    return NextResponse.json(
      { error: "Failed to sync debts" },
      { status: 500 },
    );
  }
}
