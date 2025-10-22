import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const importData = await request.json();

    // Validate import data
    if (!importData.accounts || !importData.categories) {
      return NextResponse.json(
        { error: "Invalid import data format" },
        { status: 400 }
      );
    }

    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const currentData = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(currentData);

    // Update accounts and categories, preserve transactions
    financialData.accounts = importData.accounts;
    financialData.categories = importData.categories;
    financialData.lastUpdated = new Date().toISOString();

    await fs.writeFile(
      dataPath,
      JSON.stringify(financialData, null, 2),
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      message: "Settings imported successfully",
    });
  } catch (error) {
    console.error("Error importing settings:", error);
    return NextResponse.json(
      { error: "Failed to import settings" },
      { status: 500 }
    );
  }
}
