import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { SavingsGoal, SavingsGoalsData } from "@/types/savings-goals";

const GOALS_FILE = path.join(process.cwd(), "data", "savings-goals.json");

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load goals from file
async function loadGoals(): Promise<SavingsGoalsData> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(GOALS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    // Support both old and new formats
    if (Array.isArray(parsed)) {
      return { goals: parsed, lastUpdated: new Date().toISOString() };
    }
    return parsed;
  } catch {
    return { goals: [], lastUpdated: new Date().toISOString() };
  }
}

// Save goals to file
async function saveGoals(goalsData: SavingsGoalsData): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(GOALS_FILE, JSON.stringify(goalsData, null, 2));
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const updates = await request.json();

    const goalsData = await loadGoals();
    const goals = goalsData.goals;

    const index = goals.findIndex((g) => g.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const oldGoal = goals[index];
    const updatedGoal = {
      ...oldGoal,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    goals[index] = updatedGoal;
    await saveGoals({ goals, lastUpdated: new Date().toISOString() });

    // Handle transfer transaction updates if accounts or contribution changed
    if (
      updatedGoal.monthlyContribution &&
      updatedGoal.monthlyContribution > 0 &&
      updatedGoal.fromAccountId &&
      updatedGoal.toAccountId
    ) {
      const financialDataPath = path.join(
        process.cwd(),
        "data",
        "financial-data.json"
      );
      const financialData = JSON.parse(
        await fs.readFile(financialDataPath, "utf-8")
      );

      // Find existing transfer transactions for this goal
      const existingTransfers = financialData.transactions.filter(
        (t: any) => t.savingsGoalId === id && t.type === "transfer"
      );

      // Check if accounts or amount changed
      const accountsChanged =
        oldGoal.fromAccountId !== updatedGoal.fromAccountId ||
        oldGoal.toAccountId !== updatedGoal.toAccountId;
      const amountChanged =
        oldGoal.monthlyContribution !== updatedGoal.monthlyContribution;

      if (existingTransfers.length > 0 && (accountsChanged || amountChanged)) {
        // Remove old transfers
        financialData.transactions = financialData.transactions.filter(
          (t: any) => t.savingsGoalId !== id || t.type !== "transfer"
        );

        // Create new transfers with updated info
        const transferId = `transfer-${Date.now()}`;
        const timestamp = Date.now();

        const outgoingTransfer = {
          description: `Sparen: ${updatedGoal.name}`,
          amount: -updatedGoal.monthlyContribution,
          type: "transfer",
          category: "transfer",
          accountId: updatedGoal.fromAccountId,
          toAccountId: updatedGoal.toAccountId,
          date: new Date().toISOString().split("T")[0],
          isRecurring: true,
          recurringType: "monthly",
          tags: ["savings", "transfer"],
          categoryReason: `Maandelijkse bijdrage aan spaardoel: ${updatedGoal.name}`,
          completed: false,
          savingsGoalId: updatedGoal.id,
          transferId: transferId,
          id: `tx-${timestamp}-out`,
        };

        const incomingTransfer = {
          description: `Sparen: ${updatedGoal.name}`,
          amount: updatedGoal.monthlyContribution,
          type: "transfer",
          category: "transfer",
          accountId: updatedGoal.toAccountId,
          fromAccountId: updatedGoal.fromAccountId,
          date: new Date().toISOString().split("T")[0],
          isRecurring: true,
          recurringType: "monthly",
          tags: ["savings", "transfer"],
          categoryReason: `Maandelijkse bijdrage aan spaardoel: ${updatedGoal.name}`,
          completed: false,
          savingsGoalId: updatedGoal.id,
          transferId: transferId,
          id: `tx-${timestamp}-in`,
        };

        financialData.transactions.push(outgoingTransfer, incomingTransfer);
        await fs.writeFile(
          financialDataPath,
          JSON.stringify(financialData, null, 2)
        );
      } else if (existingTransfers.length === 0) {
        // No existing transfers, create new ones
        const transferId = `transfer-${Date.now()}`;
        const timestamp = Date.now();

        const outgoingTransfer = {
          description: `Sparen: ${updatedGoal.name}`,
          amount: -updatedGoal.monthlyContribution,
          type: "transfer",
          category: "transfer",
          accountId: updatedGoal.fromAccountId,
          toAccountId: updatedGoal.toAccountId,
          date: new Date().toISOString().split("T")[0],
          isRecurring: true,
          recurringType: "monthly",
          tags: ["savings", "transfer"],
          categoryReason: `Maandelijkse bijdrage aan spaardoel: ${updatedGoal.name}`,
          completed: false,
          savingsGoalId: updatedGoal.id,
          transferId: transferId,
          id: `tx-${timestamp}-out`,
        };

        const incomingTransfer = {
          description: `Sparen: ${updatedGoal.name}`,
          amount: updatedGoal.monthlyContribution,
          type: "transfer",
          category: "transfer",
          accountId: updatedGoal.toAccountId,
          fromAccountId: updatedGoal.fromAccountId,
          date: new Date().toISOString().split("T")[0],
          isRecurring: true,
          recurringType: "monthly",
          tags: ["savings", "transfer"],
          categoryReason: `Maandelijkse bijdrage aan spaardoel: ${updatedGoal.name}`,
          completed: false,
          savingsGoalId: updatedGoal.id,
          transferId: transferId,
          id: `tx-${timestamp}-in`,
        };

        financialData.transactions.push(outgoingTransfer, incomingTransfer);
        await fs.writeFile(
          financialDataPath,
          JSON.stringify(financialData, null, 2)
        );
      }
    }

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error("Error updating savings goal:", error);
    return NextResponse.json(
      { error: "Failed to update savings goal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const goalsData = await loadGoals();
    const goals = goalsData.goals;

    const filteredGoals = goals.filter((g) => g.id !== id);

    if (filteredGoals.length === goals.length) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    await saveGoals({
      goals: filteredGoals,
      lastUpdated: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting savings goal:", error);
    return NextResponse.json(
      { error: "Failed to delete savings goal" },
      { status: 500 }
    );
  }
}
