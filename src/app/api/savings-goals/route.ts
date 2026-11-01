import { type NextRequest, NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";
import { getSavingsGoalCurrentAmount } from "@/services/savings-goal-progress";
import {
  deleteUserSavingsGoal,
  insertUserSavingsGoal,
  listUserSavingsGoals,
  syncGoalTransfers,
} from "@/services/supabase-savings-goal-store";
import type { SavingsGoal, SavingsGoalsData } from "@/types/savings-goals";

export async function GET() {
  try {
    const [storedGoals, data] = await Promise.all([
      listUserSavingsGoals(),
      FinancialDataService.getInstance().loadData(),
    ]);
    const goals = storedGoals.map((goal) => ({
      ...goal,
      currentAmount: getSavingsGoalCurrentAmount(
        goal,
        data.transactions,
        data.accounts,
        storedGoals,
      ),
    }));
    const goalsData: SavingsGoalsData = {
      goals,
      lastUpdated:
        goals.reduce(
          (latest, goal) => (goal.updatedAt > latest ? goal.updatedAt : latest),
          "",
        ) || new Date().toISOString(),
    };
    return NextResponse.json(goalsData);
  } catch (error) {
    console.error("Error loading savings goals:", error);
    return NextResponse.json(
      { error: "Failed to load savings goals" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as Partial<SavingsGoal>;
    const name = input.name;
    const targetAmount = input.targetAmount;
    const priority = input.priority;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof targetAmount !== "number" ||
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0 ||
      (input.currentAmount !== undefined &&
        (!Number.isFinite(input.currentAmount) || input.currentAmount < 0)) ||
      (input.monthlyContribution !== undefined &&
        (!Number.isFinite(input.monthlyContribution) ||
          input.monthlyContribution < 0)) ||
      (priority !== "low" && priority !== "medium" && priority !== "high")
    ) {
      return NextResponse.json(
        { error: "Name, positive target amount, and priority are required" },
        { status: 400 },
      );
    }

    const data = await FinancialDataService.getInstance().loadData();
    const now = new Date().toISOString();
    const goal: SavingsGoal = {
      ...input,
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim(),
      targetAmount,
      currentAmount: input.currentAmount ?? 0,
      priority,
      createdAt: now,
      updatedAt: now,
    };
    const created = await insertUserSavingsGoal(goal);
    try {
      await syncGoalTransfers(created, data.accounts);
    } catch (error) {
      await deleteUserSavingsGoal(created.id);
      throw error;
    }
    return NextResponse.json(created);
  } catch (error) {
    console.error("Error saving savings goal:", error);
    return NextResponse.json(
      { error: "Failed to save savings goal" },
      { status: 500 },
    );
  }
}
