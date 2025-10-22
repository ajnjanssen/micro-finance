import { NextRequest, NextResponse } from "next/server";
import { ExpensePredictionService } from "@/services/expense-prediction";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthsAhead = parseInt(searchParams.get("months") || "12");

    const service = ExpensePredictionService.getInstance();
    const predictions = await service.predictMonthlyExpenses(monthsAhead);

    return NextResponse.json(predictions);
  } catch (error) {
    console.error("Error getting expense predictions:", error);
    return NextResponse.json(
      { error: "Failed to get expense predictions" },
      { status: 500 }
    );
  }
}
