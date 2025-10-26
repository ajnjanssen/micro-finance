import { NextResponse } from "next/server";
import { AssetsLiabilitiesService } from "@/services/assets-liabilities-service";
import fs from "fs/promises";
import path from "path";

/**
 * Sync debts to recurring expenses and ensure category exists
 */
export async function POST() {
  try {
    const assetsService = AssetsLiabilitiesService.getInstance();

    // Ensure "Schulden" category exists
    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    const debtCategory = financialData.categories.find(
      (c: any) => c.id === "cat-debt-payments"
    );

    if (!debtCategory) {
      // Create the category
      financialData.categories.push({
        id: "cat-debt-payments",
        name: "Schulden",
        type: "expense",
        color: "error",
      });
      financialData.lastUpdated = new Date().toISOString();
      await fs.writeFile(
        dataPath,
        JSON.stringify(financialData, null, 2),
        "utf-8"
      );
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
      { status: 500 }
    );
  }
}
