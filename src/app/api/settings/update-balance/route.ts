import { NextResponse } from "next/server";
import { calculateAccountBalances } from "@/services/account-balance";
import { FinancialDataService } from "@/services/financial-data";

export async function POST(request: Request) {
  try {
    const { newBalance, accountId } = await request.json();

    if (typeof newBalance !== "number" || !Number.isFinite(newBalance)) {
      return NextResponse.json(
        { error: "Invalid balance value" },
        { status: 400 },
      );
    }

    const service = new FinancialDataService();
    const data = await service.loadData();

    if (data.accounts.length === 0) {
      return NextResponse.json({ error: "No accounts found" }, { status: 400 });
    }

    const checkingAccounts = data.accounts.filter(
      (account) => account.type === "checking",
    );
    const account = accountId
      ? checkingAccounts.find((candidate) => candidate.id === accountId)
      : checkingAccounts[0];

    if (!account) {
      return NextResponse.json(
        { error: "No checking account found" },
        { status: 400 },
      );
    }

    const currentBalance =
      calculateAccountBalances(data.accounts, data.transactions)[account.id] ??
      0;
    const difference = newBalance - currentBalance;
    const updatedAccount = await service.updateAccount(account.id, {
      startingBalance: (account.startingBalance || 0) + difference,
    });

    if (!updatedAccount) {
      return NextResponse.json(
        { error: "Checking account could not be updated" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Balance updated successfully",
      newBalance,
      oldBalance: currentBalance,
      accountId: account.id,
    });
  } catch (error) {
    console.error("Error updating balance:", error);
    return NextResponse.json(
      { error: "Failed to update balance" },
      { status: 500 },
    );
  }
}
