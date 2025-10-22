import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const GOALS_FILE = path.join(process.cwd(), "data", "savings-goals.json");

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  monthlySavings: number;
  targetDate?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

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
async function loadGoals(): Promise<SavingsGoal[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(GOALS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save goals to file
async function saveGoals(goals: SavingsGoal[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(GOALS_FILE, JSON.stringify(goals, null, 2));
}

export async function GET() {
  try {
    const goals = await loadGoals();
    return NextResponse.json({ goals });
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
    const body = await request.json();
    const { action, goal } = body;

    const goals = await loadGoals();

    if (action === "add") {
      const newGoal: SavingsGoal = {
        ...goal,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      goals.push(newGoal);
    } else if (action === "update") {
      const index = goals.findIndex((g) => g.id === goal.id);
      if (index !== -1) {
        goals[index] = {
          ...goals[index],
          ...goal,
          updatedAt: new Date().toISOString(),
        };
      }
    } else if (action === "delete") {
      const filteredGoals = goals.filter((g) => g.id !== goal.id);
      await saveGoals(filteredGoals);
      return NextResponse.json({ success: true });
    }

    await saveGoals(goals);
    return NextResponse.json({ success: true, goals });
  } catch (error) {
    console.error("Error saving savings goal:", error);
    return NextResponse.json(
      { error: "Failed to save savings goal" },
      { status: 500 }
    );
  }
}
