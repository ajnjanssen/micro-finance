import { NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";

export async function GET() {
  try {
    const financialData = await FinancialDataService.getInstance().loadData();

    // Export accounts, categories, and settings (excluding transactions for export)
    const exportData = {
      accounts: financialData.accounts,
      categories: financialData.categories,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Error exporting settings:", error);
    return NextResponse.json(
      { error: "Failed to export settings" },
      { status: 500 },
    );
  }
}
