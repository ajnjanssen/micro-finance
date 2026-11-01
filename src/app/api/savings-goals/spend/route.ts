import { type NextRequest, NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";
import { insertUserTransaction } from "@/services/supabase-financial-store";
import {
  listUserSavingsGoals,
  updateUserSavingsGoal,
} from "@/services/supabase-savings-goal-store";
import type { Transaction } from "@/types/finance";

export async function POST(request: NextRequest) {
  try {
    const { goalId } = (await request.json()) as { goalId?: string };
    if (!goalId) {
      return NextResponse.json(
        { error: "goalId is required" },
        { status: 400 },
      );
    }

    const goal = (await listUserSavingsGoals()).find(
      (candidate) => candidate.id === goalId,
    );
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    if (goal.spentDate) {
      return NextResponse.json(
        { error: "Goal already marked as spent" },
        { status: 400 },
      );
    }

    const financialData = await FinancialDataService.getInstance().loadData();
    const savingsAccount =
      financialData.accounts.find(
        (account) => account.id === goal.toAccountId,
      ) ?? financialData.accounts.find((account) => account.type === "savings");
    if (!savingsAccount) {
      return NextResponse.json(
        { error: "Savings account not found" },
        { status: 404 },
      );
    }

    const timestamp = new Date().toISOString();
    const transaction: Transaction = {
      id: `tx-${Date.now()}-goal-spend`,
      description: `Gekocht: ${goal.name}`,
      amount: -Math.abs(goal.targetAmount),
      type: "expense",
      category: goal.categoryId ?? "",
      accountId: savingsAccount.id,
      date: timestamp.slice(0, 10),
      isRecurring: false,
      tags: ["spaardoel", "aankoop", goal.name],
      categoryReason: `Aankoop uit spaardoel: ${goal.name}`,
      completed: true,
      completedDate: timestamp,
      savingsGoalId: goal.id,
    };

    await insertUserTransaction(transaction);
    const updatedGoal = await updateUserSavingsGoal(goal.id, {
      spentDate: timestamp,
      spentTransactionId: transaction.id,
      completedDate: goal.completedDate || timestamp,
    });
    if (!updatedGoal) throw new Error("Goal disappeared during purchase.");

    return NextResponse.json({
      success: true,
      goal: updatedGoal,
      transaction,
    });
  } catch (error) {
    console.error("Error marking goal as spent:", error);
    return NextResponse.json(
      { error: "Failed to mark goal as spent" },
      { status: 500 },
    );
  }
}
