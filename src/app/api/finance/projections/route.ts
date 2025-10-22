import { NextRequest, NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthsAhead = parseInt(searchParams.get("months") || "36");

    const service = FinancialDataService.getInstance();
    const projections = await service.projectBalance(monthsAhead);

    return NextResponse.json(projections);
  } catch (error) {
    console.error("Error getting balance projections:", error);
    return NextResponse.json(
      { error: "Failed to get projections" },
      { status: 500 }
    );
  }
}
