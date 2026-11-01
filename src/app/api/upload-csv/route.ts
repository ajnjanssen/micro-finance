import { type NextRequest, NextResponse } from "next/server";
import { parseFinancialCsv } from "@/services/csv-import-service";
import { FinancialDataService } from "@/services/financial-data";
import { insertUserTransactions } from "@/services/supabase-financial-store";

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("csv");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No CSV file uploaded" },
        { status: 400 },
      );
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV" },
        { status: 400 },
      );
    }
    if (file.size === 0 || file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: "CSV file must be between 1 byte and 10 MB" },
        { status: 400 },
      );
    }

    const financialData = await FinancialDataService.getInstance().loadData();
    const result = parseFinancialCsv(await file.text(), financialData);
    await insertUserTransactions(result.transactions);

    return NextResponse.json({
      success: true,
      message: "CSV transactions imported successfully",
      importedCount: result.transactions.length,
      skippedCount: result.skippedCount,
      totalParsed: result.parsedCount,
    });
  } catch (error) {
    console.error("CSV import failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process CSV",
      },
      { status: 400 },
    );
  }
}
