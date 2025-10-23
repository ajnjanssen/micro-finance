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

    goals[index] = {
      ...goals[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    await saveGoals({ goals, lastUpdated: new Date().toISOString() });
    return NextResponse.json(goals[index]);
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
