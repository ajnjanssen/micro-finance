import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

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
      { status: 500 }
    );
  }
}
