import { type NextRequest, NextResponse } from "next/server";
import { FinancialDataService } from "@/services/financial-data";
import { deletePendingGoalTransfers } from "@/services/supabase-financial-store";
import {
  deleteUserSavingsGoal,
  listUserSavingsGoals,
  syncGoalTransfers,
  updateUserSavingsGoal,
} from "@/services/supabase-savings-goal-store";
import type { SavingsGoal } from "@/types/savings-goals";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const updates = (await request.json()) as Partial<SavingsGoal>;
    if (
      (updates.name !== undefined &&
        (typeof updates.name !== "string" || !updates.name.trim())) ||
      (updates.targetAmount !== undefined &&
        (!Number.isFinite(updates.targetAmount) ||
          updates.targetAmount <= 0)) ||
      (updates.currentAmount !== undefined &&
        (!Number.isFinite(updates.currentAmount) ||
          updates.currentAmount < 0)) ||
      (updates.monthlyContribution !== undefined &&
        (!Number.isFinite(updates.monthlyContribution) ||
          updates.monthlyContribution < 0)) ||
      (updates.priority !== undefined &&
        !["low", "medium", "high"].includes(updates.priority))
    ) {
      return NextResponse.json(
        { error: "Invalid savings goal values" },
        { status: 400 },
      );
    }
    const {
      id: _ignoredId,
      createdAt: _ignoredCreatedAt,
      updatedAt: _ignoredUpdatedAt,
      ...safeUpdates
    } = updates;
    const goals = await listUserSavingsGoals();
    const oldGoal = goals.find((goal) => goal.id === id);
    if (!oldGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const updatedGoal = await updateUserSavingsGoal(id, {
      ...safeUpdates,
      ...(safeUpdates.name !== undefined
        ? { name: safeUpdates.name.trim() }
        : {}),
    });
    if (!updatedGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const transfersChanged =
      oldGoal.name !== updatedGoal.name ||
      oldGoal.monthlyContribution !== updatedGoal.monthlyContribution ||
      oldGoal.fromAccountId !== updatedGoal.fromAccountId ||
      oldGoal.toAccountId !== updatedGoal.toAccountId ||
      oldGoal.startDate !== updatedGoal.startDate;
    if (transfersChanged) {
      const data = await FinancialDataService.getInstance().loadData();
      await syncGoalTransfers(updatedGoal, data.accounts);
    }

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error("Error updating savings goal:", error);
    return NextResponse.json(
      { error: "Failed to update savings goal" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const goals = await listUserSavingsGoals();
    if (!goals.some((goal) => goal.id === id)) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    await deletePendingGoalTransfers(id);
    if (!(await deleteUserSavingsGoal(id))) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting savings goal:", error);
    return NextResponse.json(
      { error: "Failed to delete savings goal" },
      { status: 500 },
    );
  }
}
