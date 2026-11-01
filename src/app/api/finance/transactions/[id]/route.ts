import { type NextRequest, NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: transactionId } = await context.params;
    const updates = await request.json();

    const updated = await FinancialDataService.getInstance().updateTransaction(
      transactionId,
      updates,
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}
