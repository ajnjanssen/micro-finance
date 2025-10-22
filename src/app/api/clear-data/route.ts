import { NextResponse } from "next/server";
import { readdir, unlink, writeFile, readFile } from "fs/promises";
import path from "path";
import type { FinancialData } from "@/types/finance";

export async function POST() {
  try {
    const dataFilePath = path.join(
      process.cwd(),
      "data",
      "financial-data.json"
    );

    // Read current data to preserve accounts
    let currentData: FinancialData;
    try {
      const fileContent = await readFile(dataFilePath, "utf-8");
      currentData = JSON.parse(fileContent);
    } catch (error) {
      // If file doesn't exist, create empty structure
      currentData = {
        accounts: [],
        transactions: [],
        categories: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    // Clear transactions but keep accounts (with their manual balances)
    const clearedData: FinancialData = {
      ...currentData,
      transactions: [], // Clear all transactions (they're just reference data)
      lastUpdated: new Date().toISOString(),
    };

    // Save cleared data
    await writeFile(dataFilePath, JSON.stringify(clearedData, null, 2));

    // Remove CSV files from realdata folder
    const realdataDir = path.join(process.cwd(), "data", "realdata");
    let removedCount = 0;
    try {
      const files = await readdir(realdataDir);
      const csvFiles = files.filter((f) => f.endsWith(".csv"));

      for (const csvFile of csvFiles) {
        const filePath = path.join(realdataDir, csvFile);
        await unlink(filePath);
        console.log(`Removed CSV file: ${csvFile}`);
      }

      removedCount = csvFiles.length;
      console.log(`Removed ${csvFiles.length} CSV files`);
    } catch (fileError) {
      console.error("Error removing CSV files:", fileError);
      // Don't fail the whole operation if file removal fails
    }

    return NextResponse.json({
      success: true,
      message: `Data cleared successfully! Removed all transactions and ${removedCount} CSV files. Your accounts and manual balances are preserved.`,
      accountsPreserved: currentData.accounts.length,
      transactionsRemoved: currentData.transactions.length,
      csvFilesRemoved: removedCount,
    });
  } catch (error) {
    console.error("Clear data error:", error);
    return NextResponse.json(
      {
        error: "Failed to clear data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
