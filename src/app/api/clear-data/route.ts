import { NextResponse } from "next/server";
import { clearUserTransactions } from "@/services/supabase-financial-store";

export async function POST() {
  try {
    const transactionsRemoved = await clearUserTransactions();

    return NextResponse.json({
      success: true,
      message:
        "Transactions cleared successfully. Accounts and balances are preserved.",
      transactionsRemoved,
    });
  } catch (error) {
    console.error("Clear data error:", error);
    return NextResponse.json(
      {
        error: "Failed to clear data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
