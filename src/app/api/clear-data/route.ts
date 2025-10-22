import { NextResponse } from "next/server";
import { clearTransactions } from "../../../../scripts/clear-transactions";
import { readdir, unlink } from "fs/promises";
import path from "path";

export async function POST() {
  try {
    // Clear transactions first
    await clearTransactions();

    // Remove CSV files from realdata folder
    const realdataDir = path.join(process.cwd(), "data", "realdata");
    try {
      const files = await readdir(realdataDir);
      const csvFiles = files.filter((f) => f.endsWith(".csv"));

      for (const csvFile of csvFiles) {
        const filePath = path.join(realdataDir, csvFile);
        await unlink(filePath);
        console.log(`Removed CSV file: ${csvFile}`);
      }

      console.log(`Removed ${csvFiles.length} CSV files`);
    } catch (fileError) {
      console.error("Error removing CSV files:", fileError);
      // Don't fail the whole operation if file removal fails
    }

    return NextResponse.json({
      success: true,
      message:
        "Data cleared successfully! CSV transactions and files removed, manual transactions preserved.",
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
