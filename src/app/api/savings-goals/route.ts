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

export async function GET() {
  try {
    const goalsData = await loadGoals();
    return NextResponse.json(goalsData);
  } catch (error) {
    console.error("Error loading savings goals:", error);
    return NextResponse.json(
      { error: "Failed to load savings goals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const goal = await request.json();

    const goalsData = await loadGoals();
    const goals = goalsData.goals;

    const newGoal: SavingsGoal = {
      ...goal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    goals.push(newGoal);

    await saveGoals({ goals, lastUpdated: new Date().toISOString() });

    // Create recurring transfer transaction if monthlyContribution is set and accounts are specified
    if (
      newGoal.monthlyContribution &&
      newGoal.monthlyContribution > 0 &&
      newGoal.fromAccountId &&
      newGoal.toAccountId
    ) {
      const financialDataPath = path.join(
        process.cwd(),
        "data",
        "financial-data.json"
      );
      const financialData = JSON.parse(
        await fs.readFile(financialDataPath, "utf-8")
      );

      // Verify accounts exist
      const fromAccount = financialData.accounts.find(
        (a: any) => a.id === newGoal.fromAccountId
      );
      const toAccount = financialData.accounts.find(
        (a: any) => a.id === newGoal.toAccountId
      );

      if (fromAccount && toAccount) {
        const transferId = `transfer-${Date.now()}`;
        const timestamp = Date.now();

        // Create outgoing transfer (from source account)
        const outgoingTransfer = {
          description: `Sparen: ${newGoal.name}`,
          amount: -newGoal.monthlyContribution, // Negative = money leaving
          type: "transfer",
          category: "transfer",
          accountId: fromAccount.id,
          toAccountId: toAccount.id,
          date: new Date().toISOString().split("T")[0],
          isRecurring: true,
          recurringType: "monthly",
          tags: ["savings", "transfer"],
          categoryReason: `Maandelijkse bijdrage aan spaardoel: ${newGoal.name}`,
          completed: false,
          savingsGoalId: newGoal.id,
          transferId: transferId,
          id: `tx-${timestamp}-out`,
        };

        // Create incoming transfer (to destination account)
        const incomingTransfer = {
          description: `Sparen: ${newGoal.name}`,
          amount: newGoal.monthlyContribution, // Positive = money arriving
          type: "transfer",
          category: "transfer",
          accountId: toAccount.id,
          fromAccountId: fromAccount.id,
          date: new Date().toISOString().split("T")[0],
          isRecurring: true,
          recurringType: "monthly",
          tags: ["savings", "transfer"],
          categoryReason: `Maandelijkse bijdrage aan spaardoel: ${newGoal.name}`,
          completed: false,
          savingsGoalId: newGoal.id,
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

    return NextResponse.json(newGoal);
  } catch (error) {
    console.error("Error saving savings goal:", error);
    return NextResponse.json(
      { error: "Failed to save savings goal" },
      { status: 500 }
    );
  }
}
