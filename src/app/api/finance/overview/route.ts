import { NextRequest, NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );
    const month = parseInt(
      searchParams.get("month") || (new Date().getMonth() + 1).toString()
    );

    const service = FinancialDataService.getInstance();
    const overview = await service.getMonthlyOverview(year, month);

    return NextResponse.json(overview);
  } catch (error) {
    console.error("Error getting monthly overview:", error);
    return NextResponse.json(
      { error: "Failed to get overview" },
      { status: 500 }
    );
  }
}
