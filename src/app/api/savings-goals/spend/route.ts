import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const GOALS_FILE = path.join(process.cwd(), "data", "savings-goals.json");
const DATA_FILE = path.join(process.cwd(), "data", "financial-data.json");

export async function POST(request: NextRequest) {
  try {
    const { goalId } = await request.json();

    if (!goalId) {
      return NextResponse.json(
        { error: "goalId is required" },
        { status: 400 }
      );
    }

    // Load savings goals
    const goalsContent = await fs.readFile(GOALS_FILE, "utf-8");
    const goalsData = JSON.parse(goalsContent);

    // Find the goal
    const goal = goalsData.goals.find((g: any) => g.id === goalId);
    if (!goal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 }
      );
    }

    // Check if already spent
    if (goal.spentDate) {
      return NextResponse.json(
        { error: "Goal already marked as spent" },
        { status: 400 }
      );
    }

    // Load financial data
    const dataContent = await fs.readFile(DATA_FILE, "utf-8");
    const financialData = JSON.parse(dataContent);

    // Find savings account
    const savingsAccount = financialData.accounts.find(
      (acc: any) => acc.type === "savings"
    );

    if (!savingsAccount) {
      return NextResponse.json(
        { error: "Savings account not found" },
        { status: 404 }
      );
    }

    // Create expense transaction for the purchase
    const spendingTransaction = {
      id: `tx-${Date.now()}-goal-spend`,
      description: `Gekocht: ${goal.name}`,
      amount: -goal.targetAmount, // Negative because it's an expense
      type: "expense",
      categoryId: goal.categoryId || "", // Use goal's category if set
      category: goal.categoryId || "",
      accountId: savingsAccount.id, // Comes from savings account
      date: new Date().toISOString().split("T")[0],
      isRecurring: false,
      tags: ["spaardoel", "aankoop", goal.name],
      categoryReason: `Spending for completed savings goal: ${goal.name}`,
      completed: true,
      notes: `Purchase made from savings goal. Original target: €${goal.targetAmount}`,
      savingsGoalId: goal.id, // Link back to the goal
    };

    // Add the transaction
    financialData.transactions.push(spendingTransaction);

    // Update the goal
    goal.spentDate = new Date().toISOString();
    goal.spentTransactionId = spendingTransaction.id;
    goal.completedDate = goal.completedDate || new Date().toISOString(); // Mark as completed if not already
    goal.updatedAt = new Date().toISOString();

    // Save both files
    await fs.writeFile(GOALS_FILE, JSON.stringify(goalsData, null, 2));
    await fs.writeFile(DATA_FILE, JSON.stringify(financialData, null, 2));

    return NextResponse.json({
      success: true,
      goal,
      transaction: spendingTransaction,
    });
  } catch (error) {
    console.error("Error marking goal as spent:", error);
    return NextResponse.json(
      { error: "Failed to mark goal as spent" },
      { status: 500 }
    );
  }
}
