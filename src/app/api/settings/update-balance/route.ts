import { NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";

export async function POST(request: Request) {
  try {
    const { newBalance } = await request.json();

    if (typeof newBalance !== "number" || isNaN(newBalance)) {
      return NextResponse.json(
        { error: "Invalid balance value" },
        { status: 400 }
      );
    }

    const service = new FinancialDataService();
    const data = await service.loadData();

    if (data.accounts.length === 0) {
      return NextResponse.json(
        { error: "No accounts found" },
        { status: 400 }
      );
    }

    // Calculate current balance from all accounts
    const currentTotalBalance = data.accounts.reduce(
      (sum, account) => sum + (account.startingBalance || 0),
      0
    );

    // Add completed transactions to current balance
    const completedTransactionsTotal = data.transactions
      .filter((tx) => tx.completed)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const actualCurrentBalance = currentTotalBalance + completedTransactionsTotal;
    const difference = newBalance - actualCurrentBalance;

    // Update the first account's starting balance to reflect the new total
    // This assumes all completed transactions are already factored in
    const firstAccount = data.accounts[0];
    if (firstAccount) {
      const newStartingBalance = (firstAccount.startingBalance || 0) + difference;
      await service.updateAccount(firstAccount.id, {
        startingBalance: newStartingBalance,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Balance updated successfully",
      newBalance,
      oldBalance: actualCurrentBalance
    });
  } catch (error) {
    console.error("Error updating balance:", error);
    return NextResponse.json(
      { error: "Failed to update balance" },
      { status: 500 }
    );
  }
}
